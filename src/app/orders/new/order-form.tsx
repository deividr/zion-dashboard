"use client";

import React, { useState, useEffect, useCallback, startTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    Calendar,
    MapPin,
    Package,
    ShoppingCart,
    User,
    ArrowLeft,
    Plus,
    Trash2,
    Loader2,
    DollarSign,
    Phone,
} from "lucide-react";
import {
    Button,
    Card,
    CardContent,
    Form,
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
    Textarea,
    Separator,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    Popover,
    PopoverContent,
    PopoverTrigger,
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Combobox } from "@/components/combobox";
import { CardHeaderWithIcon } from "@/components/card-header-with-icon";
import { useFetchClient } from "@/lib/fetch-client";
import { useToast } from "@/hooks/use-toast";
import { Customer, Product, Address, Order } from "@/domains";
import { cn, formatPhone, parseNumber } from "@/lib/utils";
import { orderEndpoints } from "@/repository/orderRepository";
import { customerEndpoints } from "@/repository/customerRepository";
import { productEndpoints } from "@/repository/productRepository";

// Schema de validação do formulário
const orderFormSchema = z.object({
    customerId: z.string().uuid("Selecione um cliente"),
    pickupDate: z.date({
        required_error: "Selecione a data de retirada",
    }),
    orderLocal: z.string().min(1, "Informe o local/geladeira"),
    observations: z.string().optional(),
    addressId: z.string().optional(),
    products: z
        .array(
            z.object({
                productId: z.string().uuid(),
                name: z.string(),
                unityType: z.string(),
                quantity: z.number().min(1, "Quantidade deve ser maior que 0"),
                price: z.number().min(1, "Preço deve ser maior que 0"),
            })
        )
        .min(1, "Adicione pelo menos um produto"),
});

type OrderFormData = z.infer<typeof orderFormSchema>;

interface OrderFormProps {
    orderId?: string;
    initialData?: Order;
}

export function OrderForm({ orderId, initialData }: OrderFormProps) {
    const { fetch } = useFetchClient();
    const { toast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
    const isEditMode = !!orderId;

    const form = useForm<OrderFormData>({
        resolver: zodResolver(orderFormSchema),
        defaultValues: {
            customerId: "",
            pickupDate: new Date(),
            orderLocal: "",
            observations: "",
            addressId: "",
            products: [],
        },
    });

    const [customerPhone, setCustomerPhone] = useState("");

    const { fields, append, remove, update } = useFieldArray({
        control: form.control,
        name: "products",
    });

    // Carregar dados iniciais quando estiver editando
    useEffect(() => {
        if (initialData) {
            const pickupDate =
                typeof initialData.pickupDate === "string" ? new Date(initialData.pickupDate) : initialData.pickupDate;

            const customer = initialData.customer;

            form.reset({
                customerId: customer?.id || "",
                pickupDate: pickupDate,
                orderLocal: initialData.orderLocal || "",
                observations: initialData.observations || "",
                addressId: initialData.address?.id || "",
                products:
                    initialData.products?.map((p) => ({
                        productId: p.productId,
                        name: p.name,
                        unityType: p.unityType,
                        quantity: p.unityType === "UN" ? p.quantity : p.quantity / 1000,
                        price: p.price,
                    })) || [],
            });

            console.log(form.formState.errors);

            // Definir o cliente selecionado e telefone para exibir
            if (customer) {
                setSelectedCustomer(customer);
                setCustomerPhone(customer.phone || "");
            }
        }
    }, [initialData, form]);

    // Carregar produtos
    useEffect(() => {
        const loadProducts = async () => {
            try {
                const productsData = await fetch<{ products: Product[] }>(productEndpoints.list(1, ""));
                setProducts(productsData?.products || []);
            } catch (error) {
                console.error("Erro ao carregar produtos:", error);
                toast({
                    variant: "destructive",
                    description: "Erro ao carregar produtos",
                });
            }
        };

        loadProducts();
    }, [fetch, toast]);

    // Carregar endereços do cliente quando selecionado
    const customerId = form.watch("customerId");

    useEffect(() => {
        if (!customerId) {
            setAddresses([]);
            // Não reseta selectedCustomer aqui para não perder o cliente já encontrado
            return;
        }

        // Se já temos o cliente selecionado com o mesmo ID, só carrega os endereços
        if (selectedCustomer?.id === customerId) {
            const loadAddresses = async () => {
                try {
                    const data = await fetch<{ customer: Customer; addresses: Address[] }>(
                        customerEndpoints.get(customerId)
                    );
                    setAddresses(data?.addresses || []);

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
                setAddresses(data?.addresses || []);

                // Só atualiza selectedCustomer se não vier do initialData e se ainda não estiver definido
                if (!initialData?.customer && !selectedCustomer) {
                    setSelectedCustomer(data?.customer || null);
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
    }, [customerId, fetch, form, initialData, selectedCustomer]);

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
                setSelectedCustomer(customer);

                // Carregar endereços do cliente encontrado
                const customerData = await fetch<{ customer: Customer; addresses: Address[] }>(
                    customerEndpoints.get(customer.id || "")
                );
                setAddresses(customerData?.addresses || []);

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
                setSelectedCustomer(null);
                form.setValue("customerId", "");
                setAddresses([]);
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
            setSelectedCustomer(null);
            form.setValue("customerId", "");
            setAddresses([]);
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

    // Calcular subtotal do produto
    // No formulário, a quantidade já está na unidade correta (UN, KG ou LT)
    // então não precisa dividir por 1000 como no arquivo de detalhes
    const calculateProductSubtotal = (unityType: string, quantity: number, price: number) => {
        return quantity * price;
    };

    // Calcular total do pedido
    const calculateOrderTotal = () => {
        return fields.reduce((total, _, index) => {
            const product = form.watch(`products.${index}`);
            if (product && product.price && product.quantity) {
                return total + calculateProductSubtotal(product.unityType, product.quantity, product.price);
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

    // Submit do formulário
    const onSubmit = async (data: OrderFormData) => {
        try {
            setIsLoading(true);

            const orderData = {
                customerId: data.customerId,
                pickupDate: data.pickupDate.toISOString(),
                orderLocal: data.orderLocal,
                observations: data.observations || "",
                addressId: data.addressId || null,
                products: data.products.map((p) => ({
                    productId: p.productId,
                    quantity: p.unityType === "UN" ? p.quantity : p.quantity * 1000,
                    price: p.price,
                })),
            };

            const endpoint = orderId ? orderEndpoints.update(orderId) : orderEndpoints.create();
            const method = orderId ? "PUT" : "POST";

            const result = await fetch<{ id: string }>(endpoint, {
                method,
                body: JSON.stringify(orderData),
            });

            toast({
                variant: "success",
                description: `Pedido ${orderId ? "atualizado" : "criado"} com sucesso!`,
            });

            if (result?.id) {
                router.push(`/orders/${result.id}`);
            }
        } catch (error) {
            console.error("Erro ao salvar pedido:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const customerInitials =
        selectedCustomer?.name
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase() || "?";

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Customer Information Card */}
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
                                                                {address.street}, {address.number} -{" "}
                                                                {address.neighborhood}
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

                {/* Order Details Card */}
                <Card>
                    <CardHeaderWithIcon icon={Package} title="Detalhes do Pedido" />
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="pickupDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            Data de Retirada *
                                        </FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "dd 'de' MMMM 'de' yyyy", {
                                                                locale: ptBR,
                                                            })
                                                        ) : (
                                                            <span>Selecione uma data</span>
                                                        )}
                                                        <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <CalendarComponent
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) => date < new Date()}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="orderLocal"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4" />
                                            Local/Geladeira *
                                        </FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Ex: Geladeira 1, Balcão..." />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="observations"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Observações</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            {...field}
                                            placeholder="Adicione observações sobre o pedido..."
                                            className="min-h-[100px]"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Products Card */}
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
                                                ? calculateProductSubtotal(
                                                      product.unityType,
                                                      product.quantity || 0,
                                                      product.price || 0
                                                  )
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
                                                <p className="text-sm font-medium text-muted-foreground">
                                                    Total do Pedido
                                                </p>
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

                {/* Form Actions */}
                <div className="flex justify-end gap-4">
                    <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isLoading}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar
                    </Button>
                    <Button type="submit" disabled={isLoading || !form.formState.isValid}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Package className="mr-2 h-4 w-4" />
                                {orderId ? "Atualizar Pedido" : "Criar Pedido"}
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
