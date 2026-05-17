# Script de Backup Automático - MecanicoAmigo
# Execute este script via Agendador de Tarefas do Windows

# Configuração
$projectPath = "$env:USERPROFILE\Documents\Projetos\mechanic"
$backupFolder = "$env:USERPROFILE\Documents\Backups\MecanicoAmigo"
$dbFile = "dev.db"
$date = Get-Date -Format "yyyy-MM-dd_HHmmss"

# Criar pasta de backup se não existir
if (-not (Test-Path $backupFolder)) {
    New-Item -ItemType Directory -Path $backupFolder -Force | Out-Null
}

# Criar backup
$backupFile = "$backupFolder\backup_$date.db"
Copy-Item -Path "$projectPath\prisma\$dbFile" -Destination $backupFile -Force

# Manter apenas os últimos 8 backups (2 meses de backups semanais)
$backups = Get-ChildItem -Path $backupFolder -Filter "backup_*.db" | Sort-Object LastWriteTime -Descending
if ($backups.Count -gt 8) {
    $backups | Select-Object -Skip 8 | Remove-Item -Force
}

Write-Host "Backup realizado com sucesso: $backupFile"