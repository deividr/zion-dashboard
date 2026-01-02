"use client";

import {
    Badge,
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    Separator,
    Textarea,
} from "@/components/ui";
import { Address, Product } from "@/domains";
import { formatCurrency } from "@/lib/utils";
import { Loader2, Minus, Plus, ShoppingCart, Trash2, Truck } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { OrderFormData } from ".";

interface OrderSummarySectionProps {
    form: UseFormReturn<OrderFormData>;
    products: Product[];
    addresses: Address[];
    isLoading: boolean;
    isEditingMode: boolean;
}

export function OrderSummarySection({ form, products, addresses, isLoading, isEditingMode }: OrderSummarySectionProps) {
    const cartItems = form.watch("products") || [];
    const selectedAddressId = form.watch("addressId");

    // Calcular subtotal
    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Taxa de entrega (exemplo fixo, pode ser calculada dinamicamente)
    const deliveryFee = selectedAddressId ? 0 : 0; // R$ 5,00 se tiver endereço

    // Total
    const total = subtotal + deliveryFee;

    // Atualizar quantidade de um item
    const handleQuantityChange = (index: number, delta: number) => {
        const item = cartItems[index];
        const newQuantity =
            item.unityType === "UN" ? Math.max(1, item.quantity + delta) : Math.max(0.25, item.quantity + delta);

        const updated = [...cartItems];
        updated[index] = { ...item, quantity: newQuantity };
        form.setValue("products", updated);
    };

    // Remover item
    const handleRemoveItem = (index: number) => {
        const updated = cartItems.filter((_, i) => i !== index);
        form.setValue("products", updated);
    };

    const selectedAddress = addresses.find((addr) => addr.id === selectedAddressId);

    return (
        <Card className="h-[calc(100vh-200px)] flex flex-col">
            <CardHeader className="p-6 pb-4">
                <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Resumo do Pedido
                </CardTitle>
                <Badge variant="secondary" className="w-fit">
                    {cartItems.length} {cartItems.length === 1 ? "item" : "itens"}
                </Badge>
            </CardHeader>

            <CardContent className="p-6 pt-0 flex-1 flex flex-col gap-4 overflow-hidden">
                {/* Lista de Produtos */}
                <div className="flex-1 overflow-y-auto space-y-3">
                    {cartItems.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Nenhum produto adicionado</p>
                        </div>
                    ) : (
                        cartItems.map((item, index) => {
                            // Buscar nomes dos subprodutos
                            const subProductNames = item.subProducts
                                ?.map((subId) => {
                                    const product = products.find((p) => p.id === subId);
                                    return product?.name;
                                })
                                .filter(Boolean);

                            return (
                                <Card key={`${item.productId}-${index}`} className="shadow-sm">
                                    <CardContent className="p-3">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-sm truncate">{item.name}</h4>
                                                {subProductNames && subProductNames.length > 0 && (
                                                    <p className="text-xs text-muted-foreground">
                                                        + {subProductNames.join(", ")}
                                                    </p>
                                                )}
                                                <p className="text-primary font-semibold text-sm">
                                                    {formatCurrency(item.price)}
                                                </p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={() => handleRemoveItem(index)}
                                            >
                                                <Trash2 className="h-3 w-3 text-destructive" />
                                            </Button>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={() =>
                                                        handleQuantityChange(
                                                            index,
                                                            item.unityType === "UN" ? -1 : -0.25
                                                        )
                                                    }
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </Button>

                                                <span className="text-xs font-medium min-w-[50px] text-center">
                                                    {item.unityType === "UN" ? item.quantity : item.quantity.toFixed(2)}{" "}
                                                    {item.unityType.toLowerCase()}
                                                </span>

                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={() =>
                                                        handleQuantityChange(index, item.unityType === "UN" ? 1 : 0.25)
                                                    }
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                            </div>

                                            <span className="text-sm font-semibold">
                                                {formatCurrency(item.price * item.quantity)}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>

                {/* Observações */}
                <FormField
                    control={form.control}
                    name="observations"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-sm">Observações</FormLabel>
                            <FormControl>
                                <Textarea
                                    {...field}
                                    placeholder="Ex: Sem cebola, capricha na maionese..."
                                    className="min-h-[60px] text-sm resize-none"
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />

                {/* Totais */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-medium">{formatCurrency(subtotal)}</span>
                    </div>

                    {addresses.length > 0 && (
                        <>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground flex items-center gap-1">
                                    <Truck className="h-3 w-3" />
                                    Taxa de entrega
                                </span>
                                <span className="font-medium">
                                    {selectedAddressId ? formatCurrency(deliveryFee) : "Selecione endereço"}
                                </span>
                            </div>

                            {selectedAddress && (
                                <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                                    <p className="font-medium">Entregar em:</p>
                                    <p>
                                        {selectedAddress.street}, {selectedAddress.number} -{" "}
                                        {selectedAddress.neighborhood}
                                    </p>
                                </div>
                            )}
                        </>
                    )}

                    <Separator />

                    <div className="flex items-center justify-between">
                        <span className="font-semibold">Total</span>
                        <span className="text-xl font-bold text-primary">{formatCurrency(total)}</span>
                    </div>
                </div>

                {/* Botão Finalizar */}
                <Button type="submit" className="w-full" size="lg" disabled={isLoading || cartItems.length === 0}>
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Finalizando...
                        </>
                    ) : (
                        <>
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            {`${isEditingMode ? "Atualizar" : "Finalizar"} Pedido`}
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}
