"use client";

import React, { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { User, Phone, MapPin, Loader2 } from "lucide-react";
import {
    Card,
    CardContent,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
    Input,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui";
import { CardHeaderWithIcon } from "@/components/card-header-with-icon";
import { useFetchClient } from "@/lib/fetch-client";
import { useToast } from "@/hooks/use-toast";
import { Customer, Address } from "@/domains";
import { cn, formatPhone, parseNumber } from "@/lib/utils";
import { customerEndpoints } from "@/repository/customerRepository";
import { OrderFormData } from "./order-form";

interface OrderCustomerSectionProps {
    form: UseFormReturn<OrderFormData>;
    selectedCustomer: Customer | null;
    onSelectedCustomerAction: (customer: Customer | null) => void;
    addresses: Address[];
    onAddressesAction: (addresses: Address[]) => void;
    isEditMode: boolean;
}

export function OrderCustomerSection({
    form,
    selectedCustomer,
    onSelectedCustomerAction,
    addresses,
    onAddressesAction,
    isEditMode,
}: OrderCustomerSectionProps) {
    const { fetch } = useFetchClient();
    const { toast } = useToast();
    const [customerPhone, setCustomerPhone] = useState("");
    const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);

    const customerId = form.watch("customerId");

    // Carregar endereços do cliente quando selecionado
    useEffect(() => {
        if (!customerId) {
            onAddressesAction([]);
            return;
        }

        // Se já temos o cliente selecionado com o mesmo ID, só carrega os endereços
        if (selectedCustomer?.id === customerId) {
            const loadAddresses = async () => {
                try {
                    const data = await fetch<{ customer: Customer; addresses: Address[] }>(
                        customerEndpoints.get(customerId)
                    );
                    onAddressesAction(data?.addresses || []);

                    // Selecionar endereço padrão automaticamente apenas se não houver addressId definido
                    const currentAddressId = form.getValues("addressId");
                    if (!currentAddressId) {
                        const defaultAddress = data?.addresses?.find((addr) => addr.isDefault);
                        if (defaultAddress) {
                            form.setValue("addressId", defaultAddress.id || "");
                        }
                    }
                } catch (error) {
                    console.error("Erro ao carregar endereços:", error);
                }
            };
            loadAddresses();
            return;
        }

        // Se não temos o cliente selecionado ou é um ID diferente, carrega tudo
        const loadCustomerData = async () => {
            try {
                const data = await fetch<{ customer: Customer; addresses: Address[] }>(
                    customerEndpoints.get(customerId)
                );
                onAddressesAction(data?.addresses || []);

                // Só atualiza selectedCustomer se ainda não estiver definido
                if (!selectedCustomer) {
                    onSelectedCustomerAction(data?.customer || null);
                }

                // Selecionar endereço padrão automaticamente apenas se não houver addressId definido
                const currentAddressId = form.getValues("addressId");
                if (!currentAddressId) {
                    const defaultAddress = data?.addresses?.find((addr) => addr.isDefault);
                    if (defaultAddress) {
                        form.setValue("addressId", defaultAddress.id || "");
                    }
                }
            } catch (error) {
                console.error("Erro ao carregar endereços:", error);
            }
        };

        loadCustomerData();
    }, [customerId, fetch, form, selectedCustomer, onAddressesAction, onSelectedCustomerAction]);

    // Inicializar telefone quando o customer selecionado mudar
    useEffect(() => {
        if (selectedCustomer?.phone) {
            setCustomerPhone(selectedCustomer.phone);
        }
    }, [selectedCustomer]);

    // Função para buscar cliente por telefone
    const handleSearchCustomerByPhone = async (phone: string) => {
        const cleanPhone = parseNumber(phone);

        if (cleanPhone.length < 10) {
            form.setValue("customerId", "");
            form.trigger("customerId");
            return;
        }

        setIsSearchingCustomer(true);

        try {
            const data = await fetch<{ customers: Customer[] }>(customerEndpoints.findByPhone(cleanPhone));

            const customer = data?.customers?.[0];

            if (customer) {
                // Primeiro define o customerId para evitar que o useEffect sobrescreva
                form.setValue("customerId", customer.id || "");
                form.clearErrors("customerId");

                // Depois atualiza o selectedCustomer
                onSelectedCustomerAction(customer);

                // Carregar endereços do cliente encontrado
                const customerData = await fetch<{ customer: Customer; addresses: Address[] }>(
                    customerEndpoints.get(customer.id || "")
                );
                onAddressesAction(customerData?.addresses || []);

                // Selecionar endereço padrão automaticamente
                const defaultAddress = customerData?.addresses?.find((addr) => addr.isDefault);
                if (defaultAddress) {
                    form.setValue("addressId", defaultAddress.id || "");
                }

                toast({
                    variant: "success",
                    description: "Cliente encontrado!",
                });
            } else {
                onSelectedCustomerAction(null);
                form.setValue("customerId", "");
                onAddressesAction([]);
                form.setError("customerId", {
                    type: "manual",
                    message: "Cliente não encontrado com este telefone",
                });
                toast({
                    variant: "destructive",
                    description: "Cliente não encontrado com este telefone",
                });
            }
        } catch (error) {
            console.error("Erro ao buscar cliente:", error);
            onSelectedCustomerAction(null);
            form.setValue("customerId", "");
            onAddressesAction([]);
            form.setError("customerId", {
                type: "manual",
                message: "Erro ao buscar cliente",
            });
            toast({
                variant: "destructive",
                description: "Erro ao buscar cliente",
            });
        } finally {
            setIsSearchingCustomer(false);
        }
    };

    const customerInitials =
        selectedCustomer?.name
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase() || "?";

    return (
        <Card>
            <CardHeaderWithIcon icon={User} title="Informações do Cliente" />
            <CardContent className="space-y-6">
                <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {customerInitials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-6">
                        {/* Primeira linha: Telefone e Nome do Cliente */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="customerId"
                                render={() => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            <Phone className="h-4 w-4" />
                                            Telefone *
                                        </FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    value={formatPhone(customerPhone)}
                                                    onChange={(e) => {
                                                        const rawValue = parseNumber(e.target.value);
                                                        setCustomerPhone(rawValue);
                                                    }}
                                                    onBlur={() => {
                                                        if (!isEditMode && customerPhone) {
                                                            handleSearchCustomerByPhone(customerPhone);
                                                        }
                                                    }}
                                                    placeholder="(00) 00000-0000"
                                                    disabled={isEditMode || isSearchingCustomer}
                                                    readOnly={isEditMode}
                                                    className={cn(isEditMode && "bg-muted cursor-not-allowed")}
                                                />
                                                {isSearchingCustomer && (
                                                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                                                )}
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Nome
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        value={selectedCustomer?.name || ""}
                                        placeholder="Nome será preenchido automaticamente"
                                        disabled
                                        readOnly
                                        className="bg-muted cursor-not-allowed"
                                    />
                                </FormControl>
                            </FormItem>
                        </div>

                        {/* Segunda linha: Endereço ocupando as 2 colunas */}
                        {addresses.length > 0 && (
                            <FormField
                                control={form.control}
                                name="addressId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4" />
                                            Endereço de Entrega
                                        </FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione um endereço" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {addresses.map((address) => (
                                                    <SelectItem key={address.id} value={address.id || ""}>
                                                        {address.street}, {address.number} - {address.neighborhood}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
