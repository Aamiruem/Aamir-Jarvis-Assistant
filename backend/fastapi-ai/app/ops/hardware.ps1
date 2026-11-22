# Read-only hardware inventory of this PC, as one JSON object. Changes nothing.
$ErrorActionPreference = 'SilentlyContinue'
$cs = Get-CimInstance Win32_ComputerSystem
$os = Get-CimInstance Win32_OperatingSystem
$bios = Get-CimInstance Win32_BIOS
$cpu = @(Get-CimInstance Win32_Processor)[0]
$gpus = @(Get-CimInstance Win32_VideoController | ForEach-Object { @{ name = $_.Name; vramBytes = $_.AdapterRAM; driver = $_.DriverVersion; driverDate = if ($_.DriverDate) { $_.DriverDate.ToString('yyyy-MM-dd') } else { $null } } })
$ram = @(Get-CimInstance Win32_PhysicalMemory | ForEach-Object { @{ bytes = [int64]$_.Capacity; speed = $_.ConfiguredClockSpeed; maker = "$($_.Manufacturer)".Trim(); part = "$($_.PartNumber)".Trim() } })
$bat = Get-CimInstance Win32_Battery
$design = (Get-CimInstance -Namespace root\wmi -ClassName BatteryStaticData | Select-Object -First 1).DesignedCapacity
$full = (Get-CimInstance -Namespace root\wmi -ClassName BatteryFullChargedCapacity | Select-Object -First 1).FullChargedCapacity
$cycles = (Get-CimInstance -Namespace root\wmi -ClassName BatteryCycleCount | Select-Object -First 1).CycleCount
$disks = @(Get-PhysicalDisk | ForEach-Object {

  @{ name = $_.FriendlyName; media = "$($_.MediaType)"; bus = "$($_.BusType)"; health = "$($_.HealthStatus)"; op = "$($_.OperationalStatus)"; bytes = [int64]$_.Size }
})
$problems = @(Get-CimInstance Win32_PnPEntity -Filter 'ConfigManagerErrorCode <> 0' | Select-Object -First 25 | ForEach-Object { @{ name = $_.Name; code = $_.ConfigManagerErrorCode; cls = $_.PNPClass } })
$startup = @(Get-CimInstance Win32_StartupCommand | ForEach-Object { @{ name = $_.Name; command = $_.Command; location = $_.Location } })
$apps = @('HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*','HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*','HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*') |
  ForEach-Object { Get-ItemProperty $_ } | Where-Object { $_.DisplayName -and -not $_.SystemComponent } |
  Sort-Object DisplayName -Unique | ForEach-Object { @{ name = $_.DisplayName; version = $_.DisplayVersion; publisher = $_.Publisher; installed = $_.InstallDate } }
$temp = Get-CimInstance -Namespace root\wmi -ClassName MSAcpi_ThermalZoneTemperature | Select-Object -First 1
[pscustomobject]@{
  maker = $cs.Manufacturer; model = $cs.Model; systemType = $cs.SystemType
  os = @{ name = $os.Caption; version = $os.Version; build = $os.BuildNumber; arch = $os.OSArchitecture; bootedAt = if ($os.LastBootUpTime) { $os.LastBootUpTime.ToString('o') } else { $null }; installedAt = if ($os.InstallDate) { $os.InstallDate.ToString('yyyy-MM-dd') } else { $null } }
  bios = @{ version = $bios.SMBIOSBIOSVersion; date = if ($bios.ReleaseDate) { $bios.ReleaseDate.ToString('yyyy-MM-dd') } else { $null } }
  cpu = @{ name = "$($cpu.Name)".Trim(); cores = $cpu.NumberOfCores; threads = $cpu.NumberOfLogicalProcessors; maxMHz = $cpu.MaxClockSpeed }
  gpus = $gpus; ram = $ram; disks = $disks; driverProblems = $problems; startup = $startup
  apps = @($apps); battery = if ($bat) { @{ percent = $bat.EstimatedChargeRemaining; status = $bat.BatteryStatus; designMWh = $design; fullMWh = $full; cycles = $cycles } } else { $null }
  thermalC = if ($temp) { [math]::Round($temp.CurrentTemperature / 10 - 273.15, 1) } else { $null }
} | ConvertTo-Json -Depth 5 -Compress
