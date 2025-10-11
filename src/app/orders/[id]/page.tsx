"use client";

import React from "react";
import { Order } from "@/domains";
import { useFetchClient } from "@/lib/fetch-client";
import { useHeaderStore } from "@/stores/header-store";
import { formatPhone } from "@/lib/utils";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
    Button,
    Badge,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Separator,
    Avatar,
    AvatarFallback,
    AvatarImage,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui";
import { useToast } from "@/hooks/use-toast";
import {
    ArrowLeft,
    Calendar,
    MapPin,
    Package,
    Phone,
    User,
    Mail,
    Clock,
    CheckCircle,
    Edit,
    Trash2,
    ShoppingCart,
    DollarSign,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function OrderDetail() {
    const { fetch } = useFetchClient();
    const { id } = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const setTitle = useHeaderStore((state) => state.setTitle);

    // Função para formatar datas de forma segura
    const formatDate = (
        dateValue: string | Date | null | undefined,
        formatString: string
    ) => {
        try {
            if (!dateValue) {
                return "Data não informada";
            }

            const date =
                typeof dateValue === "string" ? new Date(dateValue) : dateValue;

            if (!date || isNaN(date.getTime())) {
                return "Data inválida";
            }

            return format(date, formatString, { locale: ptBR });
        } catch (error) {
            console.error("Erro ao formatar data:", error);
            return "Data inválida";
        }
    };

    // Função para formatar valores monetários
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value / 100); // Assumindo que os valores estão em centavos
    };

    const calculateProductSubtotal = (
        unityType: string,
        quantity: number,
        price: number
    ) => {
        return (unityType === "UN" ? quantity : quantity / 1000) * price;
    };

    const calculateOrderTotal = () => {
        if (!order?.products) return 0;

        return order.products.reduce((total, product) => {
            const productTotal = calculateProductSubtotal(
                product.unityType,
                product.quantity,
                product.price
            );
            return total + productTotal;
        }, 0);
    };

    useEffect(() => {
        setTitle([
            "Pedidos",
            order ? `Pedido #${order.number}` : "Carregando...",
        ]);
    }, [setTitle, order]);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                setIsLoading(true);
                const result = await fetch<Order | null>(
                    `${process.env.NEXT_PUBLIC_HOST_API}/orders/${id}`
                );

                setOrder(result);
            } catch (error) {
                console.error("Erro ao carregar pedido:", error);
                toast({
                    variant: "destructive",
                    description: "Erro ao carregar dados do pedido",
                });
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchOrder();
        }
    }, [id, fetch, toast]);

    const handleMarkAsPickedUp = async () => {
        if (!order) return;

        try {
            setIsUpdating(true);
            await fetch(
                `${process.env.NEXT_PUBLIC_HOST_API}/orders/${id}/pickup`,
                {
                    method: "PATCH",
                    body: JSON.stringify({ isPickedUp: true }),
                }
            );

            setOrder({ ...order, isPickedUp: true });
            toast({
                variant: "success",
                description: "Pedido marcado como retirado com sucesso!",
            });
        } catch (error) {
            console.error("Erro ao marcar como retirado:", error);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleEdit = () => {
        router.push(`/orders/${id}/edit`);
    };

    const handleDelete = async () => {
        if (!order) return;

        if (!confirm("Tem certeza que deseja excluir este pedido?")) {
            return;
        }

        try {
            await fetch(`${process.env.NEXT_PUBLIC_HOST_API}/orders/${id}`, {
                method: "DELETE",
            });

            toast({
                variant: "success",
                description: "Pedido excluído com sucesso!",
            });
            router.back();
        } catch (error) {
            console.error("Erro ao excluir pedido:", error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">
                        Carregando detalhes do pedido...
                    </p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <Package className="h-12 w-12 text-muted-foreground" />
                <div className="text-center">
                    <h3 className="text-lg font-semibold">
                        Pedido não encontrado
                    </h3>
                    <p className="text-muted-foreground">
                        O pedido solicitado não existe ou foi removido.
                    </p>
                </div>
                <Button onClick={() => router.back()} variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para Pedidos
                </Button>
            </div>
        );
    }

    const customerInitials =
        order.customer?.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase() || "?";

    return (
        <TooltipProvider>
            <div className="space-y-6">
                {/* Header Actions */}
                <div className="flex justify-between items-center gap-4">
                    {/* Botão Voltar */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                onClick={() => router.back()}
                                variant="outline"
                                size="icon"
                                className="sm:hidden"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Voltar</p>
                        </TooltipContent>
                    </Tooltip>

                    <Button
                        onClick={() => router.back()}
                        variant="outline"
                        className="hidden sm:flex"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar
                    </Button>

                    {/* Botões de Ação */}
                    <div className="flex gap-2">
                        {/* Mobile: apenas ícones */}
                        <div className="flex gap-2 sm:hidden">
                            {!order.isPickedUp && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            onClick={handleMarkAsPickedUp}
                                            disabled={isUpdating}
                                            variant="default"
                                            size="icon"
                                        >
                                            {isUpdating ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                            ) : (
                                                <CheckCircle className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Marcar como Retirado</p>
                                    </TooltipContent>
                                </Tooltip>
                            )}

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        onClick={handleEdit}
                                        variant="outline"
                                        size="icon"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Editar</p>
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        onClick={handleDelete}
                                        variant="destructive"
                                        size="icon"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Excluir</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>

                        {/* Desktop: botões com texto */}
                        <div className="hidden sm:flex gap-2">
                            {!order.isPickedUp && (
                                <Button
                                    onClick={handleMarkAsPickedUp}
                                    disabled={isUpdating}
                                    variant="default"
                                >
                                    {isUpdating ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                    ) : (
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                    )}
                                    Marcar como Retirado
                                </Button>
                            )}

                            <Button onClick={handleEdit} variant="outline">
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                            </Button>

                            <Button
                                onClick={handleDelete}
                                variant="destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Order Status Card */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="h-5 w-5" />
                                    Pedido #{order.number}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Criado em{" "}
                                    {formatDate(
                                        order.createdAt,
                                        "dd 'de' MMMM 'de' yyyy 'às' HH:mm"
                                    )}
                                </p>
                            </div>
                            <Badge
                                variant={
                                    order.isPickedUp ? "default" : "secondary"
                                }
                                className={
                                    order.isPickedUp
                                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                                        : ""
                                }
                            >
                                {order.isPickedUp ? "Retirado" : "Pendente"}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Customer Information */}
                        <div>
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Informações do Cliente
                            </h3>
                            <div className="flex items-start gap-4 p-4 border rounded-lg bg-muted/50">
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src="" />
                                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                        {customerInitials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                                    <div>
                                        <p className="font-medium">
                                            {order.customer?.name}
                                        </p>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                            <Phone className="h-3 w-3" />
                                            {formatPhone(
                                                order.customer?.phone || ""
                                            )}
                                        </div>
                                        {order.customer?.email && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                                <Mail className="h-3 w-3" />
                                                {order.customer.email}
                                            </div>
                                        )}
                                    </div>
                                    {order.customer?.phone2 && (
                                        <div>
                                            <p className="text-sm font-medium">
                                                Telefone 2:
                                            </p>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Phone className="h-3 w-3" />
                                                {formatPhone(
                                                    order.customer.phone2
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Address Information */}
                        {order.address && (
                            <>
                                <Separator />

                                <div>
                                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        Endereço de Entrega
                                    </h3>
                                    <div className="p-4 border rounded-lg bg-muted/50 space-y-2">
                                        <div className="flex items-start gap-3">
                                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                            <div className="space-y-1 flex-1">
                                                <p className="font-medium">
                                                    {order.address.street},{" "}
                                                    {order.address.number}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {order.address.neighborhood}{" "}
                                                    - {order.address.city}/
                                                    {order.address.state}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    CEP:{" "}
                                                    {order.address.cep.replace(
                                                        /(\d{5})(\d{3})/,
                                                        "$1-$2"
                                                    )}
                                                </p>
                                                {order.address
                                                    .aditionalDetails && (
                                                    <p className="text-sm text-muted-foreground italic">
                                                        {
                                                            order.address
                                                                .aditionalDetails
                                                        }
                                                    </p>
                                                )}
                                                {order.address.distance > 0 && (
                                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                        <MapPin className="h-3 w-3" />
                                                        Distância:{" "}
                                                        {order.address.distance}{" "}
                                                        km
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        <Separator />

                        {/* Order Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:items-stretch">
                            <div className="space-y-4">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Detalhes do Pedido
                                </h3>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium">
                                                Data de Retirada
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {formatDate(
                                                    order.pickupDate,
                                                    "dd 'de' MMMM 'de' yyyy"
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium">
                                                Local/Geladeira
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {order.orderLocal}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium">
                                                Última Atualização
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {formatDate(
                                                    order.updatedAt,
                                                    "dd/MM/yyyy 'às' HH:mm"
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Observations */}
                            <div className="space-y-4 flex flex-col h-full">
                                <h3 className="font-semibold">Observações</h3>
                                <div className="p-4 border rounded-lg bg-muted/50 flex-1 flex items-start">
                                    {order.observations ? (
                                        <p className="text-sm whitespace-pre-wrap">
                                            {order.observations}
                                        </p>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">
                                            Nenhuma observação adicionada a este
                                            pedido.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Products Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5" />
                            Produtos do Pedido
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {Array.isArray(order.products) &&
                        order.products.length > 0 ? (
                            <div className="space-y-6">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Produto</TableHead>
                                            <TableHead className="text-right">
                                                Qtd
                                            </TableHead>
                                            <TableHead className="text-right">
                                                Preço Unit.
                                            </TableHead>
                                            <TableHead className="text-right">
                                                Subtotal
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {order.products.map(
                                            (product, index) => (
                                                <React.Fragment
                                                    key={product.id || index}
                                                >
                                                    {/* Produto Principal */}
                                                    <TableRow>
                                                        <TableCell className="font-medium">
                                                            <div className="flex items-center gap-2">
                                                                <Package className="h-4 w-4 text-primary" />
                                                                {product.name}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {`${
                                                                product.unityType ===
                                                                "UN"
                                                                    ? product.quantity
                                                                    : product.quantity /
                                                                      1000
                                                            } ${
                                                                product.unityType
                                                            }`}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {formatCurrency(
                                                                product.price
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium">
                                                            {formatCurrency(
                                                                calculateProductSubtotal(
                                                                    product.unityType,
                                                                    product.quantity,
                                                                    product.price
                                                                )
                                                            )}
                                                        </TableCell>
                                                    </TableRow>

                                                    {/* Subprodutos */}
                                                    {product.subProducts &&
                                                        product.subProducts.map(
                                                            (
                                                                subProduct,
                                                                subIndex
                                                            ) => (
                                                                <TableRow
                                                                    key={
                                                                        subProduct.id ||
                                                                        `${index}-${subIndex}`
                                                                    }
                                                                    className="bg-muted/30"
                                                                >
                                                                    <TableCell className="pl-8">
                                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                            <div className="w-2 h-2 bg-primary/50 rounded-full" />
                                                                            {
                                                                                subProduct.name
                                                                            }
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell className="text-right text-sm text-muted-foreground">
                                                                        -
                                                                    </TableCell>
                                                                    <TableCell className="text-right text-sm text-muted-foreground">
                                                                        -
                                                                    </TableCell>
                                                                    <TableCell className="text-right text-sm text-muted-foreground">
                                                                        -
                                                                    </TableCell>
                                                                </TableRow>
                                                            )
                                                        )}
                                                </React.Fragment>
                                            )
                                        )}
                                    </TableBody>
                                </Table>

                                <Separator />

                                {/* Total do Pedido */}
                                <div className="flex justify-end">
                                    <div className="bg-primary/10 p-4 rounded-lg border">
                                        <div className="flex items-center gap-3">
                                            <DollarSign className="h-5 w-5 text-primary" />
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">
                                                    Total do Pedido
                                                </p>
                                                <p className="text-2xl font-bold text-primary">
                                                    {formatCurrency(
                                                        calculateOrderTotal()
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">
                                    Nenhum produto adicionado a este pedido.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </TooltipProvider>
    );
}
