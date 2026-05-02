$envVars = Get-Content ".env" | Where-Object { $_ -match "^[^#].*=" }
foreach ($var in $envVars) {
  $name, $value = $var -split '=', 2
  Set-Item -Path "Env:\$name" -Value $value
}
$url = $env:EXPO_PUBLIC_SUPABASE_URL + "/rest/v1"
$key = $env:EXPO_PUBLIC_SUPABASE_ANON_KEY

$schema = Invoke-RestMethod -Uri "$url/?apikey=$key" -Method Get
Write-Host "Supabase schemas:"
$schema.definitions.psobject.properties | Select-Object Name | ForEach-Object { Write-Host $_.Name }
