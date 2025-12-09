"use client";

import { CardHeaderWithIcon } from "@/components/card-header-with-icon";
import { Combobox } from "@/components/combobox";
import {
    Button,
    Card,
    CardContent,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
    Input,
    Separator,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui";
import { Product } from "@/domains";
import { DollarSign, Package, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { startTransition, useCallback } from "react";
import { UseFormReturn, useFieldArray } from "react-hook-form";
import { OrderFormData } from ".";

interface OrderProductsSectionProps {
    form: UseFormReturn<OrderFormData>;
    products: Product[];
}

export function OrderProductsSection({ form, products }: OrderProductsSectionProps) {
    const { fields, append, remove, update } = useFieldArray({
        control: form.control,
        name: "products",
    });

    // Função para adicionar produto
    const handleAddProduct = () => {
        append({
            productId: "",
            name: "",
            unityType: "UN",
            quantity: 1,
            price: 0,
        });
    };

    // Função para atualizar produto selecionado
    const handleProductSelect = useCallback(
        (index: number, productId: string, onChange?: (value: string) => void) => {
            try {
                // Verificar se o índice é válido
                if (index < 0 || index >= fields.length) {
                    console.error("Índice inválido:", index);
                    return;
                }

                const currentValues = form.getValues(`products.${index}`);
                if (!currentValues) {
                    console.error("Valores atuais não encontrados para o índice:", index);
                    return;
                }

                if (!productId || !productId.trim()) {
                    // Primeiro notificar o React Hook Form
                    if (onChange) {
                        onChange("");
                    }
                    // Depois atualizar os outros campos
                    startTransition(() => {
                        update(index, {
                            productId: "",
                            name: "",
                            unityType: "UN",
                            quantity: currentValues.quantity || 1,
                            price: 0,
                        });
                    });
                    return;
                }

                const product = products.find((p) => p.id === productId);
                if (product && product.id) {
                    const productIdValue = product.id;
                    // Primeiro notificar o React Hook Form sobre a mudança do productId
                    if (onChange) {
                        onChange(productIdValue);
                    }
                    // Depois atualizar todos os outros campos usando update do useFieldArray
                    startTransition(() => {
                        update(index, {
                            productId: productIdValue,
                            name: product.name ?? "",
                            unityType: product.unityType ?? "UN",
                            quantity: currentValues.quantity || 1,
                            price: product.value ?? 0,
                        });
                    });
                }
            } catch (error) {
                console.error("Erro ao atualizar produto:", error);
            }
        },
        [products, form, fields.length, update]
    );

    const calculateProductSubtotal = (quantity: number, price: number) => {
        return quantity * price;
    };

    // Calcular total do pedido
    const calculateOrderTotal = () => {
        return fields.reduce((total, _, index) => {
            const product = form.watch(`products.${index}`);
            if (product && product.price && product.quantity) {
                return total + calculateProductSubtotal(product.quantity, product.price);
            }
            return total;
        }, 0);
    };

    // Formatar valor monetário
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value / 100);
    };

    return (
        <Card>
            <CardHeaderWithIcon icon={ShoppingCart} title="Produtos do Pedido" />
            <CardContent className="space-y-6">
                {fields.length > 0 ? (
                    <div className="space-y-6">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Produto</TableHead>
                                    <TableHead className="text-right">Qtd</TableHead>
                                    <TableHead className="text-right">Preço Unit.</TableHead>
                                    <TableHead className="text-right">Subtotal</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {fields.map((field, index) => {
                                    const product = form.watch(`products.${index}`);
                                    const subtotal = product
                                        ? calculateProductSubtotal(product.quantity || 0, product.price || 0)
                                        : 0;

                                    return (
                                        <TableRow key={field.id}>
                                            <TableCell>
                                                <FormField
                                                    control={form.control}
                                                    name={`products.${index}.productId`}
                                                    render={({ field }) => (
                                                        <FormItem className="w-full">
                                                            <FormControl>
                                                                <Combobox
                                                                    options={products
                                                                        .filter((prod) => prod.id)
                                                                        .map((prod) => ({
                                                                            value: prod.id!,
                                                                            label: prod.name,
                                                                        }))}
                                                                    value={field.value || ""}
                                                                    onValueChange={(value) => {
                                                                        handleProductSelect(
                                                                            index,
                                                                            value || "",
                                                                            field.onChange
                                                                        );
                                                                    }}
                                                                    placeholder="Selecione um produto..."
                                                                    searchPlaceholder="Buscar produto..."
                                                                    emptyText="Nenhum produto encontrado."
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <FormField
                                                    control={form.control}
                                                    name={`products.${index}.quantity`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <div className="flex items-center gap-2 justify-end">
                                                                    <Input
                                                                        type="number"
                                                                        className="w-20 text-right"
                                                                        {...field}
                                                                        onChange={(e) =>
                                                                            field.onChange(
                                                                                parseFloat(e.target.value) || 0
                                                                            )
                                                                        }
                                                                    />
                                                                    <span className="text-sm text-muted-foreground">
                                                                        {product?.unityType || "UN"}
                                                                    </span>
                                                                </div>
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(product?.price || 0)}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {formatCurrency(subtotal)}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => remove(index)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>

                        <Separator />

                        {/* Total do Pedido */}
                        <div className="flex justify-end">
                            <div className="bg-primary/10 p-4 rounded-lg border">
                                <div className="flex items-center gap-3">
                                    <DollarSign className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Total do Pedido</p>
                                        <p className="text-2xl font-bold text-primary">
                                            {formatCurrency(calculateOrderTotal())}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground mb-4">Nenhum produto adicionado ainda.</p>
                    </div>
                )}

                <Button type="button" variant="outline" onClick={handleAddProduct} className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Produto
                </Button>
            </CardContent>
        </Card>
    );
}
