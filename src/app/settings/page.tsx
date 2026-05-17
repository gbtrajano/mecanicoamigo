'use client';

import { useEffect, useState, useRef } from 'react';
import { Download, Upload, Database, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatBytes } from '@/lib/db-utils';

export default function SettingsPage() {
  const [dbSize, setDbSize] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/db-info')
      .then(r => r.json())
      .then(data => setDbSize(data.size))
      .catch(console.error);
  }, []);

  async function handleExport() {
    setExporting(true);
    setMessage(null);
    try {
      const response = await fetch('/api/export', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to export database');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const date = new Date().toISOString().split('T')[0];
      a.download = `mechanic_backup_${date}.db`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      setMessage({
        type: 'success',
        text: 'Banco de dados exportado com sucesso!',
      });
    } catch (error) {
      console.error('Export error:', error);
      setMessage({
        type: 'error',
        text: 'Erro ao exportar banco de dados.',
      });
    } finally {
      setExporting(false);
    }
  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to import database');
      }

      setMessage({
        type: 'success',
        text: 'Banco de dados importado com sucesso! Os dados foram substituídos.',
      });

      // Refresh page after short delay to reload data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Import error:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Erro ao importar banco de dados.',
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Gerencie o banco de dados local</p>
      </div>

      {/* Database Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Gerenciamento de Dados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Info Banner */}
          <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
            <Info className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium">Armazenamento Local</p>
              <p className="text-xs text-muted-foreground mt-1">
                Todos os dados são armazenados localmente no seu dispositivo.
                Use as opções abaixo para fazer backups ou restaurar dados.
              </p>
            </div>
          </div>

          {/* Storage Info */}
          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div>
              <p className="text-sm font-medium">Tamanho do Banco de Dados</p>
              <p className="text-2xl font-bold mt-1">{formatBytes(dbSize)}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
              <Database className="w-6 h-6 text-muted-foreground" />
            </div>
          </div>

          {/* Warning Banner */}
          <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-400">Atenção</p>
              <p className="text-xs text-muted-foreground mt-1">
                Ao importar um banco de dados, todos os dados atuais serão
                substituídos. Faça um backup antes de importar.
              </p>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`flex items-center gap-3 p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30'
                  : 'bg-red-500/10 border border-red-500/30'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-500" />
              )}
              <p
                className={`text-sm ${
                  message.type === 'success' ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {message.text}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Export */}
            <div className="p-4 border border-border rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Download className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Exportar Banco de Dados</p>
                  <p className="text-xs text-muted-foreground">
                    Baixe uma cópia do seu banco de dados
                  </p>
                </div>
              </div>
              <Button
                onClick={handleExport}
                disabled={exporting}
                className="w-full"
              >
                {exporting ? 'Exportando...' : 'Exportar (.db)'}
              </Button>
            </div>

            {/* Import */}
            <div className="p-4 border border-border rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Importar Banco de Dados</p>
                  <p className="text-xs text-muted-foreground">
                    Restaure dados de um backup
                  </p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".db"
                onChange={handleImport}
                disabled={importing}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                variant="outline"
                className="w-full"
              >
                {importing ? 'Importando...' : 'Importar (.db)'}
              </Button>
            </div>
          </div>

          {/* Backup Reminder */}
          <Card className="border-dashed bg-muted/50">
            <CardHeader>
              <CardTitle className="text-base">Backup Automático Semanal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Configure backups automáticos usando o Agendador de Tarefas do Windows:
              </p>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Abra o "Agendador de Tarefas" no Windows</li>
                <li>Clique em "Criar Tarefa Básica"</li>
                <li>Dê um nome (ex: "Backup MecanicoAmigo")</li>
                <li>Escolha "Semanal" e configure o dia/hora</li>
                <li>Em "Ação", escolha "Iniciar um programa"</li>
                <li>Procure o arquivo: <code className="bg-muted px-1 rounded">scripts\backup.ps1</code> na pasta do projeto</li>
              </ol>
              <p className="text-xs text-muted-foreground mt-2">
                Os backups serão salvos em: Documentos\Backups\MecanicoAmigo
              </p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>Sobre o Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Versão:</span> 1.0.0
            </p>
            <p>
              <span className="text-muted-foreground">Tecnologia:</span> Next.js + SQLite
            </p>
            <p>
              <span className="text-muted-foreground">Armazenamento:</span> Local (nuvem não utilizada)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}