# Bluetooth devices this PC can see: paired ones and nearby discoverable ones (classic + Bluetooth LE).
# Uses the same Windows API as Settings > Add device. Read-only: pairs with nothing, connects to nothing.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0].MakeGenericMethod([Windows.Devices.Enumeration.DeviceInformationCollection, Windows.Devices.Enumeration, ContentType = WindowsRuntime])
$props = [System.Collections.Generic.List[string]]@('System.Devices.Aep.DeviceAddress','System.Devices.Aep.IsConnected','System.Devices.Aep.IsPaired','System.Devices.Aep.SignalStrength','System.Devices.Aep.Manufacturer')
$tasks = @{}
foreach ($proto in @(@('classic','{e0cbf06c-cd8b-4647-bb8a-263b43f0f974}'), @('le','{bb7bb05e-5972-42b5-94fc-76eaa7084d49}'))) {
  $op = [Windows.Devices.Enumeration.DeviceInformation]::FindAllAsync("System.Devices.Aep.ProtocolId:=`"$($proto[1])`"", $props, [Windows.Devices.Enumeration.DeviceInformationKind]::AssociationEndpoint)
  $tasks[$proto[0]] = $asTask.Invoke($null, @($op))
}
$out = @()
foreach ($k in $tasks.Keys) {
  $t = $tasks[$k]
  if (-not $t.Wait(35000)) { continue }
  foreach ($d in $t.Result) {
    $v = @{}; foreach ($kv in $d.Properties) { if ($null -ne $kv.Value) { $v[$kv.Key.Split(".")[-1]] = "$($kv.Value)" } }
    $out += [pscustomobject]@{ kind = $k; name = $d.Name; address = $v['DeviceAddress']; paired = $v['IsPaired']; connected = $v['IsConnected']; rssi = $v['SignalStrength']; mfr = $v['Manufacturer'] }
  }
}
$out | ConvertTo-Json -Depth 3 -Compress
