"""Network probes for Cyber Ops: this PC's addresses, devices on its own network, ports, Wi-Fi.

Authorized-only by construction:
- Device discovery only ever looks at the private (RFC 1918) IPv4 networks this PC is connected to,
  and at most the 254 addresses of its own /24, even when the real subnet is bigger.
- Nothing logs in, guesses passwords, or changes a device. The probes are what any device on the
  network already sees: ARP (who has this address), mDNS and SSDP announcements (what devices
  advertise about themselves), NetBIOS names, and TCP "is this port open" connects.
- Wi-Fi passwords are never read (no `netsh wlan show profile key=clear`).
"""
from __future__ import annotations

import ipaddress
import re
import socket
import struct
import time
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import httpx
import psutil

from app.config import settings
from app.device_info import _VIRTUAL

MAX_HOSTS = 254
OUI_URL = "https://standards-oui.ieee.org/oui/oui.csv"
OUI_FILE: Path = settings.data_dir / "oui.csv"
_oui: dict[str, str] | None = None

# The ports checked in a network audit, with what an open one usually means.
AUDIT_PORTS: dict[int, str] = {
    21: "FTP", 22: "SSH", 23: "Telnet", 53: "DNS", 80: "HTTP", 135: "Windows RPC", 139: "NetBIOS",
    443: "HTTPS", 445: "SMB file sharing", 515: "LPD printing", 554: "RTSP video (camera)", 631: "IPP printing",
    1883: "MQTT (IoT)", 3389: "Remote Desktop", 5000: "UPnP / NAS", 5555: "Android debug (ADB)",
    5900: "VNC remote control", 7547: "TR-069 (ISP management)", 8008: "Chromecast / Android TV",
    8009: "Chromecast / Android TV", 8080: "HTTP (alt)", 8443: "HTTPS (alt)", 9100: "Raw printing",
    62078: "Apple device sync",
}
# Open ports that are a real risk on a home or office network: (severity, why, fix).
RISKY_PORTS: dict[int, tuple[str, str, str]] = {
    23: ("high", "Telnet sends logins in plain text and is a favourite target of IoT malware.", "Turn Telnet off in the device's settings or update its firmware; use SSH if you need remote access."),
    5555: ("high", "Android debugging over the network lets anyone on this network control the device.", "On the device: Settings → Developer options → turn off Wireless/ADB debugging."),
    21: ("medium", "FTP sends passwords and files unencrypted.", "Disable FTP or switch to SFTP/FTPS."),
    5900: ("medium", "VNC remote control is open; many VNC setups have weak or no passwords.", "Turn it off when not needed, or put it behind a VPN with a strong password."),
    3389: ("medium", "Remote Desktop is reachable from the network.", "Turn Remote Desktop off if you don't use it, or allow only Network Level Authentication with a strong password."),
    7547: ("medium", "The ISP management port (TR-069) answers on the local network.", "Ask your ISP or update the router firmware; it should not be exposed."),
    1883: ("medium", "An MQTT broker without TLS: IoT messages may be readable or forgeable.", "Enable authentication and TLS (port 8883) on the broker."),
    445: ("low", "SMB file sharing is open.", "Fine on your own PCs and NAS; turn file sharing off on devices that don't need it."),
}


# ---------- this PC ----------

def local_networks() -> list[dict]:
    """The private IPv4 networks of this PC's real adapters that are up: [{interface, ip, network, scan}]."""
    stats = psutil.net_if_stats()
    out = []
    for name, addrs in psutil.net_if_addrs().items():
        if _VIRTUAL.search(name) or not (stats.get(name) and stats[name].isup):
            continue
        for a in addrs:
            if a.family != socket.AF_INET or not a.netmask:
                continue
            ip = ipaddress.IPv4Address(a.address)
            if not ip.is_private or ip.is_loopback or ip.is_link_local:
                continue
            net = ipaddress.IPv4Network(f"{a.address}/{a.netmask}", strict=False)
            out.append({"interface": name, "ip": str(ip), "network": str(net), "scan": str(scan_range(ip, net))})
    return out


def scan_range(ip: ipaddress.IPv4Address, net: ipaddress.IPv4Network) -> ipaddress.IPv4Network:
    """What discovery may probe: the PC's own network, capped at its /24 (254 hosts)."""
    if net.prefixlen >= 24:
        return net
    return ipaddress.IPv4Network(f"{ip}/24", strict=False)


def hosts_to_probe(networks: list[dict]) -> list[str]:
    seen: list[str] = []
    for n in networks:
        net = ipaddress.IPv4Network(n["scan"])
        if not net.is_private:
            continue
        for h in list(net.hosts())[:MAX_HOSTS]:
            s = str(h)
            if s != n["ip"] and s not in seen:
                seen.append(s)
    return seen


IPCONFIG_PS = r"""
$ErrorActionPreference = 'SilentlyContinue'
$profiles = @{}; Get-NetConnectionProfile | ForEach-Object { $profiles[$_.InterfaceAlias] = @{ name = $_.Name; category = "$($_.NetworkCategory)" } }
$routes = @{}; Get-NetRoute -DestinationPrefix '0.0.0.0/0' | ForEach-Object { $routes[$_.InterfaceAlias] = @($routes[$_.InterfaceAlias]) + $_.NextHop }
$dns = @{}; Get-DnsClientServerAddress -AddressFamily IPv4 | ForEach-Object { $dns[$_.InterfaceAlias] = @($_.ServerAddresses) }
$v6 = @{}; Get-NetIPAddress -AddressFamily IPv6 | Where-Object { $_.PrefixOrigin -ne 'WellKnown' } | ForEach-Object { $v6[$_.InterfaceAlias] = @($v6[$_.InterfaceAlias]) + $_.IPAddress }
@(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike 'Loopback*' -and $_.AddressState -eq 'Preferred' } | Group-Object InterfaceAlias | ForEach-Object {
  $a = $_.Name
  @{ alias = $a; ipv4 = @($_.Group.IPAddress); prefix = @($_.Group.PrefixLength); ipv6 = @($v6[$a] | Where-Object { $_ }); gateway = @($routes[$a] | Where-Object { $_ });
     dns = @($dns[$a]); profile = $profiles[$a] }
}) | ConvertTo-Json -Depth 4 -Compress
"""


def adapter_extras() -> dict[str, dict]:
    """MAC address and link speed per adapter name, from psutil (Get-NetAdapter takes ~5 s)."""
    out = {}
    stats = psutil.net_if_stats()
    for name, addrs in psutil.net_if_addrs().items():
        mac = next((a.address for a in addrs if a.family == psutil.AF_LINK), None)
        st = stats.get(name)
        out[name] = {"mac": mac.upper().replace(":", "-") if mac else None, "speed": f"{st.speed} Mbps" if st and st.speed else None}
    return out


def public_ip() -> dict:
    """This connection's public address as the internet sees it (ipinfo.io, falling back to ipify)."""
    try:
        r = httpx.get("https://ipinfo.io/json", timeout=6, headers={"Accept": "application/json"})
        r.raise_for_status()
        d = r.json()
        return {"ip": d.get("ip"), "isp": d.get("org"), "city": d.get("city"), "region": d.get("region"), "country": d.get("country"), "source": "ipinfo.io"}
    except Exception:
        r = httpx.get("https://api.ipify.org?format=json", timeout=6)
        r.raise_for_status()
        return {"ip": r.json().get("ip"), "source": "ipify.org"}


# ---------- MAC vendors ----------

def is_private_mac(mac: str) -> bool:
    """Locally administered MAC: phones, tablets and Windows use these as 'private Wi-Fi addresses'."""
    try:
        return bool(int(mac.replace("-", ":").split(":")[0], 16) & 0x02)
    except (ValueError, IndexError):
        return False


def parse_oui_csv(text: str) -> dict[str, str]:
    out = {}
    for line in text.splitlines()[1:]:
        m = re.match(r'^[^,]*,([0-9A-Fa-f]{6}),("([^"]*)"|[^,]*)', line)
        if m:
            out[m.group(1).upper()] = (m.group(3) if m.group(3) is not None else m.group(2)).strip()
    return out


def load_oui(download: bool = True) -> dict[str, str]:
    """IEEE's public list of MAC prefixes -> manufacturer, downloaded once and kept in data_dir."""
    global _oui
    if _oui is not None:
        return _oui
    if not OUI_FILE.exists() and download:
        try:
            r = httpx.get(OUI_URL, timeout=25, follow_redirects=True, headers={"User-Agent": "Azarvis/2.0"})
            r.raise_for_status()
            OUI_FILE.write_text(r.text, encoding="utf-8")
        except Exception:
            return {}
    try:
        _oui = parse_oui_csv(OUI_FILE.read_text(encoding="utf-8"))
    except OSError:
        return {}
    return _oui


def vendor_for(mac: str, oui: dict[str, str]) -> str | None:
    if not mac or is_private_mac(mac):
        return None
    return oui.get(re.sub(r"[^0-9A-Fa-f]", "", mac)[:6].upper())


# ---------- neighbours (ARP) ----------

ARP_PS = r"""
$ErrorActionPreference = 'SilentlyContinue'
@(Get-NetNeighbor -AddressFamily IPv4 | Where-Object { $_.State -notin @('Unreachable','Permanent','Incomplete') -and $_.LinkLayerAddress -and $_.LinkLayerAddress -ne '00-00-00-00-00-00' } |
  ForEach-Object { @{ ip = $_.IPAddress; mac = $_.LinkLayerAddress; state = "$($_.State)"; alias = $_.InterfaceAlias } }) | ConvertTo-Json -Compress
"""


def parse_arp_a(text: str) -> list[dict]:
    """`arp -a` output (fallback when Get-NetNeighbor is unavailable)."""
    out = []
    for m in re.finditer(r"^\s*(\d+\.\d+\.\d+\.\d+)\s+([0-9a-f]{2}(?:[-:][0-9a-f]{2}){5})\s+(\w+)", text, re.I | re.M):
        ip, mac, kind = m.groups()
        if mac.lower() in ("ff-ff-ff-ff-ff-ff", "ff:ff:ff:ff:ff:ff") or ip.startswith(("224.", "239.")) or ip.endswith(".255"):
            continue
        out.append({"ip": ip, "mac": mac.upper().replace(":", "-"), "state": kind.lower(), "alias": None})
    return out


def wake_neighbours(ips: list[str], local_ip: str | None = None):
    """Send one tiny UDP packet to each address so Windows asks 'who has this IP?' (ARP).
    Devices that ignore ping (most phones) still answer ARP. Port 9 is the discard port."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        if local_ip:
            s.bind((local_ip, 0))
        for ip in ips:
            try:
                s.sendto(b"\0", (ip, 9))
            except OSError:
                pass
    finally:
        s.close()


# ---------- DNS (mDNS answers) ----------

def _read_name(data: bytes, off: int, depth: int = 0) -> tuple[str, int]:
    labels = []
    jumped_end = None
    while True:
        if off >= len(data) or depth > 20:
            raise ValueError("bad DNS name")
        n = data[off]
        if n == 0:
            off += 1
            break
        if n & 0xC0 == 0xC0:
            ptr = ((n & 0x3F) << 8) | data[off + 1]
            if jumped_end is None:
                jumped_end = off + 2
            off = ptr
            depth += 1
            continue
        labels.append(data[off + 1: off + 1 + n].decode("utf-8", "replace"))
        off += 1 + n
    return ".".join(labels), (jumped_end if jumped_end is not None else off)


def parse_dns(data: bytes) -> list[dict]:
    """Answer, authority and additional records of a DNS packet: [{name, type, data}]."""
    if len(data) < 12:
        return []
    _, _, qd, an, ns, ar = struct.unpack("!6H", data[:12])
    off = 12
    for _ in range(qd):
        _, off = _read_name(data, off)
        off += 4
    out = []
    for _ in range(an + ns + ar):
        name, off = _read_name(data, off)
        rtype, _, _, rdlen = struct.unpack("!HHIH", data[off: off + 10])
        off += 10
        rd = data[off: off + rdlen]
        value = None
        if rtype == 1 and rdlen == 4:
            value = socket.inet_ntoa(rd)
        elif rtype == 12:
            value, _ = _read_name(data, off)
        elif rtype == 33 and rdlen >= 6:
            port = struct.unpack("!H", rd[4:6])[0]
            target, _ = _read_name(data, off + 6)
            value = {"port": port, "target": target}
        elif rtype == 16:
            items, i = {}, 0
            while i < len(rd):
                ln = rd[i]
                kv = rd[i + 1: i + 1 + ln].decode("utf-8", "replace")
                if "=" in kv:
                    k, v = kv.split("=", 1)
                    items[k.lower()] = v
                i += 1 + ln
            value = items
        if value is not None:
            out.append({"name": name, "type": rtype, "data": value})
        off += rdlen
    return out


MDNS_SERVICES = [
    "_services._dns-sd._udp.local", "_googlecast._tcp.local", "_airplay._tcp.local", "_raop._tcp.local",
    "_companion-link._tcp.local", "_ipp._tcp.local", "_printer._tcp.local", "_pdl-datastream._tcp.local",
    "_spotify-connect._tcp.local", "_hap._tcp.local", "_smb._tcp.local", "_workstation._tcp.local",
    "_device-info._tcp.local", "_androidtvremote2._tcp.local", "_amzn-wplay._tcp.local", "_http._tcp.local",
    "_sleep-proxy._udp.local", "_homekit._tcp.local", "_matter._tcp.local",
]


def _dns_query(names: list[str], qtype: int = 12, unicast_response: bool = True) -> bytes:
    out = struct.pack("!6H", 0, 0, len(names), 0, 0, 0)
    for n in names:
        for label in n.strip(".").split("."):
            b = label.encode()
            out += bytes([len(b)]) + b
        out += b"\0" + struct.pack("!HH", qtype, 0x8001 if unicast_response else 1)
    return out


def mdns_browse(local_ips: list[str], seconds: float = 2.5) -> dict[str, dict]:
    """What devices announce over mDNS (Bonjour): {ip: {names, services, txt}}. A query from a normal
    port gets 'legacy unicast' replies sent straight back to us, so this needs no port 5353 of its own."""
    found: dict[str, dict] = {}
    socks = []
    query = _dns_query(MDNS_SERVICES)
    for lip in local_ips:
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.bind((lip, 0))
            s.setsockopt(socket.IPPROTO_IP, socket.IP_MULTICAST_IF, socket.inet_aton(lip))
            s.setsockopt(socket.IPPROTO_IP, socket.IP_MULTICAST_TTL, 1)
            s.settimeout(0.3)
            s.sendto(query, ("224.0.0.251", 5353))
            socks.append(s)
        except OSError:
            pass
    end = time.time() + seconds
    try:
        while time.time() < end and socks:
            for s in socks:
                try:
                    data, (src, _) = s.recvfrom(9000)
                except (socket.timeout, OSError):
                    continue
                try:
                    records = parse_dns(data)
                except Exception:
                    continue
                d = found.setdefault(src, {"names": [], "services": [], "txt": {}, "hosts": []})
                for r in records:
                    if r["type"] == 12:
                        svc = r["name"].replace(".local", "")
                        inst = r["data"]
                        if svc.startswith("_services"):
                            continue
                        if svc not in d["services"]:
                            d["services"].append(svc)
                        label = inst.split("._")[0]
                        if label and label not in d["names"]:
                            d["names"].append(label)
                    elif r["type"] == 33:
                        host = r["data"]["target"].removesuffix(".local")
                        if host and host not in d["hosts"]:
                            d["hosts"].append(host)
                    elif r["type"] == 16:
                        d["txt"].update({k: v for k, v in r["data"].items() if k in ("md", "fn", "model", "am", "ty", "usb_mfg", "usb_mdl", "manufacturer", "product", "rpmd")})
    finally:
        for s in socks:
            s.close()
    return found


# ---------- SSDP / UPnP ----------

def ssdp_search(local_ips: list[str], seconds: float = 2.5) -> dict[str, dict]:
    """Devices that answer a UPnP search (TVs, routers, printers, media boxes): {ip: {server, location}}."""
    msg = ("M-SEARCH * HTTP/1.1\r\nHOST: 239.255.255.250:1900\r\nMAN: \"ssdp:discover\"\r\nMX: 2\r\nST: ssdp:all\r\n\r\n").encode()
    found: dict[str, dict] = {}
    socks = []
    for lip in local_ips:
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.bind((lip, 0))
            s.setsockopt(socket.IPPROTO_IP, socket.IP_MULTICAST_IF, socket.inet_aton(lip))
            s.setsockopt(socket.IPPROTO_IP, socket.IP_MULTICAST_TTL, 2)
            s.settimeout(0.3)
            s.sendto(msg, ("239.255.255.250", 1900))
            socks.append(s)
        except OSError:
            pass
    end = time.time() + seconds
    try:
        while time.time() < end and socks:
            for s in socks:
                try:
                    data, (src, _) = s.recvfrom(4096)
                except (socket.timeout, OSError):
                    continue
                headers = {}
                for line in data.decode("utf-8", "replace").split("\r\n")[1:]:
                    if ":" in line:
                        k, v = line.split(":", 1)
                        headers[k.strip().lower()] = v.strip()
                d = found.setdefault(src, {"server": None, "locations": [], "types": []})
                d["server"] = d["server"] or headers.get("server")
                loc = headers.get("location")
                if loc and loc not in d["locations"]:
                    d["locations"].append(loc)
                st = headers.get("st")
                if st and st.startswith("urn:") and st not in d["types"]:
                    d["types"].append(st)
    finally:
        for s in socks:
            s.close()
    return found


def upnp_description(location: str, expected_ip: str) -> dict:
    """friendlyName / manufacturer / model from a device's UPnP description (same device's address only)."""
    host = httpx.URL(location).host
    if host != expected_ip or not ipaddress.ip_address(host).is_private:
        return {}
    r = httpx.get(location, timeout=2.5)
    root = ET.fromstring(r.content)
    ns = {"u": root.tag.split("}")[0].strip("{")} if root.tag.startswith("{") else {}
    dev = root.find("u:device", ns) if ns else root.find("device")
    if dev is None:
        return {}

    def g(tag):
        el = dev.find(f"u:{tag}", ns) if ns else dev.find(tag)
        return (el.text or "").strip() if el is not None and el.text else None

    return {"friendly": g("friendlyName"), "manufacturer": g("manufacturer"), "model": g("modelName"),
            "model_number": g("modelNumber"), "device_type": g("deviceType")}


# ---------- NetBIOS (Windows PC names) ----------

def netbios_name(ip: str, timeout: float = 0.8) -> str | None:
    """The NetBIOS computer name a Windows PC (or NAS) gives for its address, if it answers."""
    name = b"CK" + b"A" * 30  # encoded "*"
    pkt = struct.pack("!6H", 0x1337, 0, 1, 0, 0, 0) + bytes([32]) + name + b"\0" + struct.pack("!HH", 0x21, 1)
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.settimeout(timeout)
    try:
        s.sendto(pkt, (ip, 137))
        data, _ = s.recvfrom(2048)
    except OSError:
        return None
    finally:
        s.close()
    return parse_nbstat(data)


def parse_nbstat(data: bytes) -> str | None:
    try:
        off = 12
        _, off = _read_name(data, off)
        off += 10  # type, class, ttl, rdlength
        count = data[off]
        off += 1
        for i in range(count):
            entry = data[off + 18 * i: off + 18 * (i + 1)]
            nm, suffix, flags = entry[:15].decode("ascii", "replace").strip(), entry[15], struct.unpack("!H", entry[16:18])[0]
            if suffix == 0 and not flags & 0x8000 and nm:
                return nm
    except Exception:
        return None
    return None


# ---------- ports ----------

def tcp_open(ip: str, port: int, timeout: float = 0.6) -> bool:
    try:
        with socket.create_connection((ip, port), timeout=timeout):
            return True
    except OSError:
        return False


def scan_ports(ips: list[str], ports: list[int], cancelled=lambda: False) -> dict[str, list[int]]:
    jobs = [(ip, p) for ip in ips for p in ports]
    found: dict[str, list[int]] = {ip: [] for ip in ips}
    with ThreadPoolExecutor(max_workers=96) as pool:
        for (ip, p), ok in zip(jobs, pool.map(lambda j: False if cancelled() else tcp_open(*j), jobs)):
            if ok:
                found[ip].append(p)
    return found


def reverse_dns(ip: str) -> str | None:
    try:
        name = socket.gethostbyaddr(ip)[0]
        return None if name == ip else name
    except OSError:
        return None


# ---------- what kind of device is it ----------

_VENDOR_HINTS = [
    (r"apple", "Apple device"), (r"samsung", "Samsung device"), (r"xiaomi|redmi|poco", "Xiaomi device"),
    (r"oneplus|oppo|vivo|realme|motorola|huawei|honor|nothing technology|google", "Phone or tablet"),
    (r"hewlett|hp inc|canon|epson|brother|kyocera|ricoh|xerox|lexmark", "Printer"),
    (r"tp-link|tplink|netgear|d-link|dlink|ubiquiti|mikrotik|tenda|zte|asustek|linksys|cisco|aruba|juniper|nokia shanghai|sagemcom|huawei technologies", "Network equipment"),
    (r"amazon", "Amazon Echo / Fire TV"), (r"sony|lg electronics|tcl|hisense|vizio|roku|sharp|panasonic|philips|xiaomi tv", "Smart TV / media"),
    (r"\bintel\b|liteon|lite-on|azurewave|hon hai|foxconn|dell|lenovo|micro-star|gigabyte|asrock|qualcomm atheros", "Computer"),
    (r"hikvision|dahua|ezviz|reolink|wyze|imou|aditya infotech|cp plus|uniview|godrej security", "Camera"),
    (r"qingdao intelligent|hisense|skyworth|xiaomi communications", "Smart TV / media"),
    (r"synology|qnap|western digital", "NAS storage"),
    (r"espressif|tuya|shenzhen|hangzhou|realtek semiconductor|beken|bouffalo|silicon labs|nordic", "IoT / smart device"),
]


def classify(dev: dict) -> str:
    """A best guess at the device's category from what it advertises, its open ports and maker."""
    if dev.get("is_self"):
        return "This PC"
    if dev.get("is_gateway"):
        return "Router / gateway"
    services = " ".join(dev.get("services") or []) + " " + " ".join(dev.get("upnp_types") or [])
    ports = set(dev.get("open_ports") or [])
    text = " ".join(filter(None, [dev.get("vendor"), dev.get("manufacturer"), dev.get("model"), dev.get("hostname"), " ".join(dev.get("names") or [])])).lower()
    if re.search(r"googlecast|androidtvremote|amzn-wplay|mediarenderer|dial|roku", services, re.I) or 8008 in ports or 8009 in ports:
        return "Smart TV / media"
    if re.search(r"_ipp|_printer|_pdl-datastream|printer", services, re.I) or 9100 in ports or 631 in ports:
        return "Printer"
    if re.search(r"_hap|_homekit|_matter", services) or 1883 in ports:
        return "IoT / smart device"
    if 554 in ports or re.search(r"camera|ipc|nvr", text):
        return "Camera"
    if 62078 in ports or re.search(r"iphone|ipad", text):
        return "Phone or tablet"
    if re.search(r"macbook|imac|mac mini|mac-mini", text):
        return "Computer"
    if re.search(r"\b(tv|bravia|firetv|fire tv|chromecast)\b", text):
        return "Smart TV / media"
    if re.search(r"android|galaxy|pixel|phone|redmi|oneplus|vivo|oppo|realme", text):
        return "Phone or tablet"
    if dev.get("netbios") or {135, 139, 445, 3389} & ports or "_workstation" in services or "_smb" in services:
        return "Computer"
    for rx, label in _VENDOR_HINTS:
        if re.search(rx, text):
            return label
    if dev.get("mac_private"):
        return "Phone or tablet"
    return "Unknown device"


def device_security(dev: dict) -> dict:
    notes, level = [], "ok"
    order = ["ok", "low", "medium", "high"]
    for p in dev.get("open_ports") or []:
        if p in RISKY_PORTS:
            sev, why, _ = RISKY_PORTS[p]
            if dev.get("category") == "Computer" and p in (445, 3389):
                sev = "low"
            notes.append(f"Port {p} ({AUDIT_PORTS.get(p, '')}): {why}")
            level = max(level, sev, key=order.index)
    if dev.get("is_gateway") and 80 in (dev.get("open_ports") or []) and 443 not in (dev.get("open_ports") or []):
        notes.append("The router's admin page is plain HTTP: its password crosses the network unencrypted.")
        level = max(level, "low", key=order.index)
    if dev.get("category") == "Unknown device" and not dev.get("is_self"):
        notes.append("Not identified: check your router's client list that you recognise it.")
    return {"level": level, "notes": notes}


# ---------- Wi-Fi ----------

def parse_netsh_blocks(text: str) -> list[dict]:
    """`netsh wlan show ...` output -> one dict per block (keys lower-case, as printed)."""
    blocks, cur = [], {}
    for line in text.splitlines():
        m = re.match(r"^\s*([^:]+?)\s*:\s(.*)$", line)
        if not m:
            continue
        key, val = m.group(1).strip().lower(), m.group(2).strip()
        if (key == "name" or re.fullmatch(r"ssid \d+", key)) and cur:
            blocks.append(cur)
            cur = {}
        if re.fullmatch(r"ssid \d+", key):
            cur["ssid"] = val
            continue
        if key.startswith("bssid"):
            cur.setdefault("bssids", []).append(val)
            continue
        cur.setdefault(key, val)
    if cur:
        blocks.append(cur)
    return blocks


def grade_wifi(auth: str, cipher: str) -> tuple[str, str, str]:
    """(severity, plain explanation, fix) for a Wi-Fi network's security."""
    a, c = (auth or "").lower(), (cipher or "").lower()
    if "open" in a or a in ("", "none") or c == "none":
        return "high", "Open network: anyone nearby can read unencrypted traffic and join.", "Avoid it, or use a VPN; on your own router set WPA2-Personal (AES) or WPA3."
    if "wep" in a or "wep" in c:
        return "high", "WEP is broken and can be cracked in minutes.", "Change the router to WPA2-Personal (AES) or WPA3."
    if "wpa3" in a:
        return "ok", "WPA3: the current strongest Wi-Fi security.", ""
    if "tkip" in c or a in ("wpa-personal", "wpa-enterprise"):
        return "medium", "WPA/TKIP is outdated and weak.", "Set the router to WPA2 with AES (CCMP) or WPA3."
    if "wpa2" in a:
        return "ok", "WPA2 with AES: secure with a long password.", "If your router supports it, WPA3 (or WPA2/WPA3 mixed) is stronger."
    return "low", f"Security type '{auth}' was not recognised.", ""
