"""The local bridge: the Azarvis website may read this PC's device details, nobody else may."""
import pytest
from fastapi.testclient import TestClient

from app.device_info import classify_interface, device_details
from app.main import app

SITE = "https://azarvis-app.vercel.app"


@pytest.fixture(scope="module")
def local():
    # A request from this machine, addressed to 127.0.0.1 (what the browser on the PC sends).
    with TestClient(app, base_url="http://127.0.0.1:8001", client=("127.0.0.1", 50123)) as c:
        yield c


def test_the_website_reads_device_details(local):
    r = local.get("/local/device", headers={"Origin": SITE})
    assert r.status_code == 200
    assert r.headers["access-control-allow-origin"] == SITE
    assert r.headers["access-control-allow-private-network"] == "true"
    body = r.json()
    assert body["source"] == "pc"
    assert 0 <= body["cpu"]["percent"] <= 100
    assert body["memory"]["total_gb"] > 0
    assert 0 <= body["disk"]["percent"] <= 100
    assert set(body["network"]) >= {"online", "type", "wired", "wifi", "bytes_recv"}
    # Nothing personal.
    assert not ({"hostname", "user", "ip", "username"} & set(body))


def test_preflight_answers_private_network_access(local):
    r = local.options(
        "/local/device",
        headers={"Origin": SITE, "Access-Control-Request-Method": "GET", "Access-Control-Request-Private-Network": "true"},
    )
    assert r.status_code == 204
    assert r.headers["access-control-allow-private-network"] == "true"
    assert r.headers["access-control-allow-origin"] == SITE


def test_other_websites_are_refused(local):
    r = local.get("/local/device", headers={"Origin": "https://evil.example"})
    assert r.status_code == 403
    assert "access-control-allow-origin" not in r.headers
    pre = local.options("/local/device", headers={"Origin": "https://evil.example", "Access-Control-Request-Method": "GET"})
    assert pre.status_code == 403


def test_dns_rebinding_and_remote_clients_are_refused():
    # A page on evil.example that re-points its name at 127.0.0.1 sends Host: evil.example.
    with TestClient(app, base_url="http://evil.example:8001", client=("127.0.0.1", 50124)) as c:
        assert c.get("/local/device", headers={"Origin": SITE}).status_code == 403
    # Another machine on the network.
    with TestClient(app, base_url="http://127.0.0.1:8001", client=("192.168.1.20", 50125)) as c:
        assert c.get("/local/device", headers={"Origin": SITE}).status_code == 403


def test_other_endpoints_still_need_the_internal_key(local):
    assert local.get("/system/status", headers={"Origin": SITE}).status_code in (401, 403)


@pytest.mark.parametrize(
    ("name", "kind"),
    [
        ("Ethernet", "ethernet"),
        ("Ethernet 2", "ethernet"),
        ("eth0", "ethernet"),
        ("enp3s0", "ethernet"),
        ("Wi-Fi", "wifi"),
        ("wlan0", "wifi"),
        ("Loopback Pseudo-Interface 1", None),
        ("vEthernet (WSL)", None),
        ("VirtualBox Host-Only Network", None),
        ("Bluetooth Network Connection", None),
        ("lo", None),
    ],
)
def test_classify_interface(name, kind):
    assert classify_interface(name) == kind


def test_device_details_is_cached_briefly():
    assert device_details() is device_details()
