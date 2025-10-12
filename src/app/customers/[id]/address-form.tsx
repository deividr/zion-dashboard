"use client";

import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Address, addressSchema, Customer } from "@/domains";
import { toast } from "@/hooks/use-toast";
import { useFetchClient } from "@/lib/fetch-client";
import { fetchCepData, formatCep, parseNumber, calculateDistanceFromStore } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MapPin, Navigation, Star, CheckCircle2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

interface AddressFormProps {
    isOpen: boolean;
    onOpenChangeAction: (open: boolean) => void;
    onSubmitAction: (data: Address) => Promise<void>;
    address?: Address;
    isEditing: boolean;
    customer: Customer;
}

const defaultValues: Address = {
    cep: "",
    street: "",
    number: "",
    neighborhood: "",
    city: "",
    state: "",
    aditionalDetails: "",
    isDefault: false,
    distance: 0,
};

export function AddressForm({
    isOpen,
    onOpenChangeAction,
    onSubmitAction,
    address,
    isEditing,
    customer,
}: AddressFormProps) {
    const { fetch } = useFetchClient();
    const [isLoadingCep, setIsLoadingCep] = useState(false);
    const [cepValidated, setCepValidated] = useState(false);

    const formEditAddress = useForm<Address>({
        resolver: zodResolver(addressSchema),
        defaultValues,
        mode: "onChange",
    });

    const watchedFields = formEditAddress.watch();

    useEffect(() => {
        if (address) {
            formEditAddress.reset({
                ...address,
                cep: address.cep ? formatCep(address.cep.replace(/\D/g, "")) : "",
                distance: Number(address.distance) || 0,
            });
            setCepValidated(!!address.cep);
        } else {
            formEditAddress.reset(defaultValues);
            setCepValidated(false);
        }
    }, [address, formEditAddress]);

    const handleCloseForm = () => {
        formEditAddress.reset();
        setCepValidated(false);
        setIsLoadingCep(false);
        onOpenChangeAction(false);
    };

    const handleSubmit = async (data: Address) => {
        if (data.distance === 0) {
            try {
                const fullAddress = `${data.street}, ${data.number}, ${data.neighborhood}, ${data.city}, ${data.state}`;
                data.distance = await calculateDistanceFromStore(fullAddress);
            } catch (error: unknown) {
                toast({
                    variant: "destructive",
                    description: (error as Error).message || "Erro ao calcular distância",
                });
            }
        }

        if (customer.id) {
            const url = address?.id
                ? `${process.env.NEXT_PUBLIC_HOST_API}/customers/${customer.id}/addresses/${address.id}`
                : `${process.env.NEXT_PUBLIC_HOST_API}/customers/${customer.id}/addresses`;

            const method = address?.id ? "PUT" : "POST";

            const result = await fetch<Address>(url, {
                method,
                body: JSON.stringify({
                    ...data,
                    customerId: customer.id,
                }),
            });

            data.id = result?.id ?? address?.id;

            toast({
                variant: "success",
                description: `Endereço ${isEditing ? "atualizado" : "adicionado"} com sucesso!`,
            });
        }

        await onSubmitAction(data);
        handleCloseForm();
    };

    const handleCepBlur = useCallback(
        async (e: React.FocusEvent<HTMLInputElement>) => {
            const cep = e.target.value.replace(/\D/g, "");
            if (cep.length === 8) {
                setIsLoadingCep(true);
                try {
                    const data = await fetchCepData(cep);
                    formEditAddress.setValue("street", data.street);
                    formEditAddress.setValue("neighborhood", data.neighborhood);
                    formEditAddress.setValue("city", data.city);
                    formEditAddress.setValue("state", data.state);
                    formEditAddress.clearErrors("cep");
                    setCepValidated(true);

                    toast({
                        variant: "success",
                        description: "CEP encontrado! Dados preenchidos automaticamente.",
                    });
                } catch {
                    formEditAddress.setError("cep", {
                        type: "manual",
                        message: "CEP inválido ou não encontrado",
                    });
                    setCepValidated(false);
                } finally {
                    setIsLoadingCep(false);
                }
            } else {
                setCepValidated(false);
            }
        },
        [formEditAddress]
    );

    // Cálculo de progresso do formulário
    const calculateProgress = () => {
        const requiredFields = ["cep", "street", "number", "neighborhood", "city", "state"];
        const filledFields = requiredFields.filter((field) => watchedFields[field as keyof Address]);
        return (filledFields.length / requiredFields.length) * 100;
    };

    const progress = calculateProgress();

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChangeAction}>
            <SheetContent className="min-w-[540px] overflow-y-auto">
                <SheetHeader className="space-y-4 pb-6">
                    <div className="flex items-center space-x-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <SheetTitle className="text-xl">
                                {isEditing ? "Editar Endereço" : "Adicionar Novo Endereço"}
                            </SheetTitle>
                            <SheetDescription>
                                Preencha as informações do endereço. Os campos marcados com * são obrigatórios.
                            </SheetDescription>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Progresso do preenchimento</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                            <div
                                className="bg-gradient-to-r from-primary to-primary/70 h-2 rounded-full transition-all duration-500 ease-in-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </SheetHeader>

                <Form {...formEditAddress}>
                    <form onSubmit={formEditAddress.handleSubmit(handleSubmit)} className="space-y-6">
                        {/* Seção CEP */}
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="text-xs font-medium text-primary">1</span>
                                </div>
                                <h3 className="font-medium">Localização</h3>
                            </div>

                            <div className="pl-8 space-y-4">
                                <FormField
                                    control={formEditAddress.control}
                                    name="cep"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center space-x-2">
                                                <span>CEP *</span>
                                                {cepValidated && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                                                {isLoadingCep && (
                                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                                )}
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="00000-000"
                                                    value={formatCep(field.value || "")}
                                                    onChange={(e) => {
                                                        const rawValue = parseNumber(e.target.value);
                                                        if (rawValue.length <= 8) {
                                                            field.onChange(formatCep(rawValue));
                                                        }
                                                    }}
                                                    onBlur={(e) => {
                                                        if (e.target.value.length === 9) {
                                                            handleCepBlur(e);
                                                        }
                                                    }}
                                                    className={
                                                        cepValidated ? "border-green-500 focus:border-green-500" : ""
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <Separator />

                        {/* Seção Endereço */}
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="text-xs font-medium text-primary">2</span>
                                </div>
                                <h3 className="font-medium">Dados do Endereço</h3>
                            </div>

                            <div className="pl-8 space-y-4">
                                <FormField
                                    control={formEditAddress.control}
                                    name="street"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Rua/Avenida *</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Ex: Rua das Flores" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={formEditAddress.control}
                                        name="number"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Número *</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="123" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={formEditAddress.control}
                                        name="neighborhood"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Bairro *</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="Centro" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={formEditAddress.control}
                                        name="city"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Cidade *</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="São Paulo" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={formEditAddress.control}
                                        name="state"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Estado *</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        maxLength={2}
                                                        placeholder="SP"
                                                        value={field.value?.toUpperCase() ?? ""}
                                                        onChange={(e) => {
                                                            field.onChange(e.target.value.toUpperCase());
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={formEditAddress.control}
                                    name="aditionalDetails"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Complemento</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Apto 101, Bloco A" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <Separator />

                        {/* Seção Configurações */}
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="text-xs font-medium text-primary">3</span>
                                </div>
                                <h3 className="font-medium">Configurações</h3>
                            </div>

                            <div className="pl-8 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={formEditAddress.control}
                                        name="distance"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center space-x-2">
                                                    <Navigation className="h-4 w-4" />
                                                    <span>Distância (km)</span>
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="0.1"
                                                        min="0"
                                                        {...field}
                                                        value={Number(field.value)}
                                                        onChange={(e) => {
                                                            const value =
                                                                e.target.value === "" ? 0 : Number(e.target.value);
                                                            field.onChange(value);
                                                        }}
                                                        placeholder="0.0"
                                                        className="w-full"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="flex items-end">
                                        <FormField
                                            control={formEditAddress.control}
                                            name="isDefault"
                                            render={({ field }) => (
                                                <FormItem className="w-full">
                                                    <div className="flex items-center space-x-3 h-10">
                                                        <FormControl>
                                                            <input
                                                                type="checkbox"
                                                                id="isDefault"
                                                                checked={field.value ?? false}
                                                                onChange={field.onChange}
                                                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary focus:ring-2 focus:ring-offset-0"
                                                            />
                                                        </FormControl>
                                                        <FormLabel
                                                            htmlFor="isDefault"
                                                            className="flex items-center space-x-2 cursor-pointer text-sm font-medium leading-none"
                                                        >
                                                            <Star className="h-4 w-4 text-amber-500" />
                                                            <span>Endereço principal</span>
                                                        </FormLabel>
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <SheetFooter className="gap-4 pt-6">
                            <Button type="button" variant="outline" onClick={handleCloseForm} className="flex-1">
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={[
                                    formEditAddress.formState.isSubmitting,
                                    !formEditAddress.formState.isValid,
                                    progress < 100,
                                ].includes(true)}
                                className="flex-1"
                            >
                                {formEditAddress.formState.isSubmitting && (
                                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                                )}
                                {isEditing ? "Atualizar Endereço" : "Salvar Endereço"}
                            </Button>
                        </SheetFooter>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    );
}
