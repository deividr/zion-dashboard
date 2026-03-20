import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OrderTicketData } from "@/hooks/usePrintTicket";

interface OrderTicketPreviewProps {
  data: OrderTicketData;
}

export function OrderTicketPreview({ data }: OrderTicketPreviewProps) {
  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  return (
    <Card className="max-w-[320px] mx-auto font-mono text-xs">
      <CardHeader className="pb-2">
        <CardTitle className="text-center text-lg font-bold">
          LaBuonapasta
        </CardTitle>
        <CardDescription className="text-center">
          Pedido #{data.orderNumber}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-center text-muted-foreground">
          <p>{data.date}</p>
        </div>

        {data.customerName && (
          <div className="border-t border-b border-dashed py-2">
            <p>
              <span className="font-semibold">Cliente:</span>{" "}
              {data.customerName}
            </p>
            {data.customerPhone && (
              <p>
                <span className="font-semibold">Tel:</span> {data.customerPhone}
              </p>
            )}
          </div>
        )}

        <div className="border-t border-dashed pt-2">
          <div className="grid grid-cols-12 gap-1 font-semibold text-muted-foreground">
            <span className="col-span-6">Produto</span>
            <span className="col-span-2 text-right">Qtd</span>
            <span className="col-span-4 text-right">Valor</span>
          </div>
        </div>

        <div className="space-y-1">
          {data.items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-1">
              <span className="col-span-6 truncate">{item.name}</span>
              <span className="col-span-2 text-right">
                {item.quantity}
                {item.unit}
              </span>
              <span className="col-span-4 text-right">
                {formatCurrency(item.price)}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed pt-2 space-y-1">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency(data.subtotal)}</span>
          </div>
          {data.deliveryFee !== undefined && data.deliveryFee > 0 && (
            <div className="flex justify-between">
              <span>Entrega:</span>
              <span>{formatCurrency(data.deliveryFee)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base">
            <span>Total:</span>
            <span>{formatCurrency(data.total)}</span>
          </div>
        </div>

        {data.observations && (
          <div className="border-t border-dashed pt-2">
            <p className="font-semibold">Obs:</p>
            <p className="text-muted-foreground">{data.observations}</p>
          </div>
        )}

        {data.paymentMethod && (
          <p className="text-center text-muted-foreground">
            Pagamento: {data.paymentMethod}
          </p>
        )}

        <p className="text-center text-muted-foreground pt-2">
          Obrigado pela preferência!
        </p>
      </CardContent>
    </Card>
  );
}
