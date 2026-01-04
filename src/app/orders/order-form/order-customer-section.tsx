"use client";

import { CardHeaderWithIcon } from "@/components/card-header-with-icon";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
    Button,
    Card,
    CardContent,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    Input,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui";
import { Address, Customer } from "@/domains";
import { useToast } from "@/hooks/use-toast";
import { useFetchClient } from "@/lib/fetch-client";
import { cn, formatPhone, parseNumber } from "@/lib/utils";
import { customerEndpoints } from "@/repository/customerRepository";
import { Loader2, MapPin, Phone, Plus, Search, User } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { OrderFormData } from ".";

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
    const router = useRouter();
    const searchParams = useSearchParams();
    const phoneFromUrl = searchParams.get("phone");
    const [customerPhone, setCustomerPhone] = useState("");
    const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
    const [customerNotFound, setCustomerNotFound] = useState(false);
    const [hasSearchedFromUrl, setHasSearchedFromUrl] = useState(false);

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

    // Função para limpar cliente selecionado (em novos pedidos)
    const handleClearCustomer = () => {
        if (!isEditMode) {
            onSelectedCustomerAction(null);
            form.setValue("customerId", "");
            onAddressesAction([]);
            form.setValue("addressId", "");
            setCustomerNotFound(false);
            form.clearErrors("customerId");
        }
    };

    // Função para buscar cliente por telefone
    const handleSearchCustomerByPhone = async (phone: string) => {
        const cleanPhone = parseNumber(phone);

        if (cleanPhone.length < 10) {
            form.setValue("customerId", "");
            form.trigger("customerId");
            setCustomerNotFound(false);
            return;
        }

        setIsSearchingCustomer(true);
        setCustomerNotFound(false);

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

                // Garantir que addressId está vazio (não é entrega por padrão)
                if (!isEditMode) {
                    form.setValue("addressId", "");
                }

                setCustomerNotFound(false);
                toast({
                    variant: "success",
                    description: "Cliente encontrado!",
                });
            } else {
                onSelectedCustomerAction(null);
                form.setValue("customerId", "");
                onAddressesAction([]);
                form.setValue("addressId", "");
                setCustomerNotFound(true);
                form.setError("customerId", {
                    type: "manual",
                    message: "Cliente não encontrado com este telefone",
                });
            }
        } catch (error) {
            console.error("Erro ao buscar cliente:", error);
            onSelectedCustomerAction(null);
            form.setValue("customerId", "");
            onAddressesAction([]);
            form.setValue("addressId", "");
            setCustomerNotFound(true);
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

    // Função para criar novo cliente
    const handleCreateNewCustomer = () => {
        const cleanPhone = parseNumber(customerPhone);
        router.push(`/customers/new?phone=${cleanPhone}&returnToOrder=true`);
    };

    // Buscar cliente automaticamente quando voltar da criação com telefone na URL
    useEffect(() => {
        if (phoneFromUrl && !isEditMode && !hasSearchedFromUrl && !selectedCustomer) {
            const cleanPhone = parseNumber(phoneFromUrl);
            setCustomerPhone(cleanPhone);
            setHasSearchedFromUrl(true);
            // Buscar cliente automaticamente
            handleSearchCustomerByPhone(cleanPhone);
            // Limpar o query parameter da URL após um pequeno delay
            setTimeout(() => {
                router.replace("/orders/new", { scroll: false });
            }, 500);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phoneFromUrl, isEditMode, hasSearchedFromUrl, selectedCustomer]);

    const customerInitials =
        selectedCustomer?.name
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase() || "?";

    return (
        <Card className="h-[calc(100vh-200px)] flex flex-col">
            <CardHeaderWithIcon icon={User} title="Identificação do Cliente" />
            <CardContent className="space-y-4 flex-1">
                {/* Avatar e Nome */}
                <div className="flex flex-col items-center text-center gap-3">
                    <Avatar className="h-16 w-16">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                            {customerInitials}
                        </AvatarFallback>
                    </Avatar>
                    {selectedCustomer && (
                        <div>
                            <p className="font-semibold">{selectedCustomer.name}</p>
                            <p className="text-sm text-muted-foreground">{formatPhone(selectedCustomer.phone)}</p>
                        </div>
                    )}
                </div>

                {/* Busca por Telefone */}
                <FormField
                    control={form.control}
                    name="customerId"
                    render={() => (
                        <FormItem>
                            <FormLabel className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4" />
                                Telefone
                            </FormLabel>
                            <FormControl>
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Input
                                                value={formatPhone(customerPhone)}
                                                onChange={(e) => {
                                                    const rawValue = parseNumber(e.target.value);
                                                    setCustomerPhone(rawValue);
                                                    // Limpar cliente quando mudar o telefone em novos pedidos
                                                    if (!isEditMode && selectedCustomer) {
                                                        handleClearCustomer();
                                                    }
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" && !isEditMode && customerPhone) {
                                                        e.preventDefault();
                                                        handleSearchCustomerByPhone(customerPhone);
                                                    }
                                                }}
                                                placeholder="(00) 00000-0000"
                                                disabled={isEditMode || isSearchingCustomer}
                                                readOnly={isEditMode}
                                                className={cn(isEditMode && "bg-muted cursor-not-allowed")}
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() => {
                                                if (!isEditMode && customerPhone) {
                                                    handleSearchCustomerByPhone(customerPhone);
                                                }
                                            }}
                                            disabled={isEditMode || isSearchingCustomer || !customerPhone}
                                        >
                                            {isSearchingCustomer ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Search className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                    {customerNotFound && !isEditMode && (
                                        <Button
                                            type="button"
                                            variant="default"
                                            className="w-full"
                                            onClick={handleCreateNewCustomer}
                                        >
                                            <Plus className="mr-2 h-4 w-4" />
                                            Criar Novo Cliente
                                        </Button>
                                    )}
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Endereço de Entrega */}
                {selectedCustomer && (
                    <FormField
                        control={form.control}
                        name="addressId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center gap-2 text-sm">
                                    <MapPin className="h-4 w-4" />
                                    Endereço de Entrega
                                </FormLabel>
                                <Select
                                    onValueChange={(value) => {
                                        // Permite limpar a seleção (valor vazio)
                                        field.onChange(value === "none" ? "" : value);
                                    }}
                                    value={field.value || "none"}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="none">
                                            <span className="text-muted-foreground">Não é entrega (Retirada)</span>
                                        </SelectItem>
                                        {addresses.length > 0 ? (
                                            addresses.map((address) => (
                                                <SelectItem key={address.id} value={address.id || ""}>
                                                    <div className="text-xs">
                                                        <p className="font-medium">
                                                            {address.street}, {address.number}
                                                        </p>
                                                        <p className="text-muted-foreground">{address.neighborhood}</p>
                                                    </div>
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="no-address" disabled>
                                                <span className="text-muted-foreground">
                                                    Nenhum endereço cadastrado
                                                </span>
                                            </SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                {!selectedCustomer && (
                    <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm">Digite o telefone do cliente para buscar</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
