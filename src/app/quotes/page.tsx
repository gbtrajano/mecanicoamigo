'use client';

import { useEffect, useState } from 'react';
import { Calculator, Copy, Check, Send, Car, User, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface QuoteItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export default function QuotesPage() {
  const [clientName, setClientName] = useState('');
  const [vehicleInfo, setVehicleInfo] = useState('');
  const [items, setItems] = useState<QuoteItem[]>([
    { description: '', quantity: 1, unitPrice: 0 }
  ]);
  const [labor, setLabor] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [copied, setCopied] = useState(false);

  function addItem() {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof QuoteItem, value: string | number) {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  }

  function calculateTotal() {
    const itemsTotal = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    return Math.max(0, itemsTotal + labor - discount);
  }

  function generateWhatsAppMessage() {
    const date = new Date().toLocaleDateString('pt-BR');
    const total = calculateTotal().toFixed(2);

    let message = `*ORÇAMENTO - ${date}*\n\n`;
    message += `*Cliente:* ${clientName || 'Não informado'}\n`;
    message += `*Veículo:* ${vehicleInfo || 'Não informado'}\n\n`;
    message += `*ITENS:*\n`;

    items.forEach((item, index) => {
      if (item.description) {
        const itemTotal = (item.quantity * item.unitPrice).toFixed(2);
        message += `${index + 1}. ${item.description}\n`;
        message += `   Qtd: ${item.quantity} x R$ ${item.unitPrice.toFixed(2)} = R$ ${itemTotal}\n`;
      }
    });

    if (labor > 0) {
      message += `\n*Mão de obra:* R$ ${labor.toFixed(2)}\n`;
    }

    if (discount > 0) {
      message += `\n*Desconto:* R$ ${discount.toFixed(2)}\n`;
    }

    message += `\n*TOTAL: R$ ${total}*\n\n`;
    message += `_Este orçamento é válido por 7 dias._\n`;
    message += `_Para confirmar, entre em contato conosco._`;

    return message;
  }

  async function copyToClipboard() {
    const message = generateWhatsAppMessage();
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function sendToWhatsApp() {
    const message = encodeURIComponent(generateWhatsAppMessage());
    window.open(`https://wa.me/?text=${message}`, '_blank');
  }

  function clearForm() {
    setClientName('');
    setVehicleInfo('');
    setItems([{ description: '', quantity: 1, unitPrice: 0 }]);
    setLabor(0);
    setDiscount(0);
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Calculator className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Orçamento WhatsApp</h1>
            <p className="text-muted-foreground">Crie orçamentos para enviar via WhatsApp</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dados do Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Nome do Cliente"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Digite o nome do cliente"
            />
            <Input
              label="Veículo"
              value={vehicleInfo}
              onChange={(e) => setVehicleInfo(e.target.value)}
              placeholder="Placa - Modelo - Ano"
            />
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Cliente:</span>
              <span className="font-medium">{clientName || '-'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Veículo:</span>
              <span className="font-medium">{vehicleInfo || '-'}</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Itens:</span>
              <span className="font-medium">{items.filter(i => i.description).length}</span>
            </div>
            <div className="pt-2 border-t">
              <p className="text-lg font-bold">Total: R$ {calculateTotal().toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Itens do Orçamento</CardTitle>
          <Button variant="outline" size="sm" onClick={addItem}>
            + Adicionar Item
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="flex flex-col md:flex-row gap-2 p-3 bg-secondary/50 rounded-lg">
              <Input
                placeholder="Descrição do item/serviço"
                value={item.description}
                onChange={(e) => updateItem(index, 'description', e.target.value)}
                className="flex-1"
              />
              <Input
                type="number"
                placeholder="Qtd"
                value={item.quantity}
                onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                className="w-20"
              />
              <Input
                type="number"
                placeholder="R$"
                value={item.unitPrice}
                onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                className="w-28"
              />
              <span className="flex items-center text-sm font-mono text-muted-foreground w-24">
                R$ {(item.quantity * item.unitPrice).toFixed(2)}
              </span>
              {items.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(index)}
                  className="text-destructive hover:text-destructive"
                >
                  ×
                </Button>
              )}
            </div>
          ))}

          {/* Labor and Discount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <Input
              label="Mão de Obra (R$)"
              type="number"
              value={labor}
              onChange={(e) => setLabor(parseFloat(e.target.value) || 0)}
            />
            <Input
              label="Desconto (R$)"
              type="number"
              value={discount}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col md:flex-row gap-4">
        <Button variant="outline" onClick={clearForm}>
          Limpar
        </Button>
        <Button
          variant="secondary"
          onClick={copyToClipboard}
          disabled={!clientName && !vehicleInfo}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Copiado!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copiar Mensagem
            </>
          )}
        </Button>
        <Button
          onClick={sendToWhatsApp}
          disabled={!clientName && !vehicleInfo}
        >
          <Send className="w-4 h-4 mr-2" />
          Enviar via WhatsApp
        </Button>
      </div>

      {/* Message Preview */}
      {(clientName || vehicleInfo) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preview da Mensagem</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm bg-secondary/50 p-4 rounded-lg overflow-x-auto">
              {generateWhatsAppMessage()}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}