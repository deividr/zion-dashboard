"use client";

import React from "react";
import { Address, Customer } from "@/domains";
import { useHeaderStore } from "@/stores/header-store";
import { useFetchClient } from "@/lib/fetch-client";
import { formatPhone } from "@/lib/utils";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CustomerForm } from "./customer-form";
import { AddressSection } from "./address-section";
import {
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Avatar,
    AvatarFallback,
    AvatarImage,
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui";
import { useToast } from "@/hooks/use-toast";
import {
    ArrowLeft,
    User,
    Mail,
    Phone,
    MapPin,
    Edit,
    Trash2,
    Plus,
} from "lucide-react";

export default function CustomerDetail() {
    const { fetch } = useFetchClient();
    const { id } = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const setTitle = useHeaderStore((state) => state.setTitle);

    useEffect(() => {
        setTitle([
            "Clientes",
            id === "new"
                ? "Novo Cliente"
                : customer
                ? customer.name
                : "Carregando...",
        ]);
    }, [setTitle, id, customer]);

    useEffect(() => {
        if (id === "new") {
            setCustomer({
                name: "",
                email: "",
                phone: "",
                phone2: "",
            });
            setIsLoading(false);
            return;
        }

        const fetchCustomer = async () => {
            try {
                setIsLoading(true);
                const result = await fetch<{
                    customer: Customer;
                    addresses: Address[];
                }>(`${process.env.NEXT_PUBLIC_HOST_API}/customers/${id}`);
                setCustomer(result?.customer ?? null);
                setAddresses(result?.addresses ?? []);
            } catch (error) {
                console.error("Erro ao carregar cliente:", error);
                toast({
                    variant: "destructive",
                    description: "Erro ao carregar dados do cliente",
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchCustomer();
    }, [id, fetch, toast]);

    const handleEdit = () => {
        // Para modo de edição, podemos alterar para mostrar o formulário
        // ou navegar para uma página de edição específica
        router.push(`/customers/${id}/edit`);
    };

    const handleDelete = async () => {
        if (!customer || !customer.id) return;

        if (!confirm("Tem certeza que deseja excluir este cliente?")) {
            return;
        }

        try {
            setIsDeleting(true);
            await fetch(
                `${process.env.NEXT_PUBLIC_HOST_API}/customers/${customer.id}`,
                {
                    method: "DELETE",
                }
            );

            toast({
                variant: "success",
                description: "Cliente excluído com sucesso!",
            });
            router.back();
        } catch (error) {
            console.error("Erro ao excluir cliente:", error);
            toast({
                variant: "destructive",
                description: "Erro ao excluir cliente",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">
                        Carregando detalhes do cliente...
                    </p>
                </div>
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <User className="h-12 w-12 text-muted-foreground" />
                <div className="text-center">
                    <h3 className="text-lg font-semibold">
                        Cliente não encontrado
                    </h3>
                    <p className="text-muted-foreground">
                        O cliente solicitado não existe ou foi removido.
                    </p>
                </div>
                <Button onClick={() => router.back()} variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para Clientes
                </Button>
            </div>
        );
    }

    // Se for um novo cliente, mostrar o formulário de criação
    if (id === "new") {
        return (
            <CustomerForm customer={customer}>
                <AddressSection
                    initialAddresses={addresses}
                    customer={customer}
                />
            </CustomerForm>
        );
    }

    const customerInitials =
        customer?.name
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
                                        disabled={isDeleting}
                                        variant="destructive"
                                        size="icon"
                                    >
                                        {isDeleting ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                        ) : (
                                            <Trash2 className="h-4 w-4" />
                                        )}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Excluir</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>

                        {/* Desktop: botões com texto */}
                        <div className="hidden sm:flex gap-2">
                            <Button onClick={handleEdit} variant="outline">
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                            </Button>

                            <Button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                variant="destructive"
                            >
                                {isDeleting ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                ) : (
                                    <Trash2 className="mr-2 h-4 w-4" />
                                )}
                                Excluir
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Customer Details Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Dados do Cliente
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Customer Header with Avatar */}
                        <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
                            <Avatar className="h-16 w-16">
                                <AvatarImage src="" />
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                                    {customerInitials}
                                </AvatarFallback>
                            </Avatar>
                            <h3 className="text-lg font-semibold">
                                {customer.name}
                            </h3>
                        </div>

                        {/* Customer Information */}
                        <div className="p-4 border rounded-lg bg-muted/50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            Telefone Principal
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-muted-foreground" />
                                            <p>
                                                {formatPhone(
                                                    customer.phone || ""
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    {customer.phone2 && (
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">
                                                Telefone 2
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                                <p>
                                                    {formatPhone(
                                                        customer.phone2
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    {customer.email && (
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">
                                                Email
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-muted-foreground" />
                                                <p>{customer.email}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Addresses Section */}
                <div className="space-y-4">
                    {/* Header da seção de endereços */}
                    <div className="flex justify-between items-center gap-4">
                        {/* Botão Adicionar Endereço */}
                        <div className="flex gap-2 ml-auto">
                            {/* Mobile: apenas ícone */}
                            <div className="sm:hidden">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            onClick={() => {
                                                // Trigger do AddressSection será chamado via ref ou context
                                                const event = new CustomEvent(
                                                    "addAddress"
                                                );
                                                window.dispatchEvent(event);
                                            }}
                                            variant="default"
                                            size="icon"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Adicionar Endereço</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>

                            {/* Desktop: botão com texto */}
                            <Button
                                onClick={() => {
                                    // Trigger do AddressSection será chamado via ref ou context
                                    const event = new CustomEvent("addAddress");
                                    window.dispatchEvent(event);
                                }}
                                variant="default"
                                className="hidden sm:flex"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Adicionar Endereço
                            </Button>
                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="h-5 w-5" />
                                Endereços do Cliente
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <AddressSection
                                initialAddresses={addresses}
                                customer={customer}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </TooltipProvider>
    );
}
