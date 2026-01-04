"use client";

import { CardHeaderWithIcon } from "@/components/card-header-with-icon";
import { Avatar, AvatarFallback, AvatarImage, Card, CardContent, CardFooter } from "@/components/ui";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Customer, customerSchema } from "@/domains";
import { useToast } from "@/hooks/use-toast";
import { useFetchClient } from "@/lib/fetch-client";
import { formatPhone, parseNumber } from "@/lib/utils";
import { customerEndpoints } from "@/repository/customerRepository";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Mail, Pencil, Phone, Plus, Trash2, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const defaultValues: Customer = {
    name: "",
    email: "",
    phone: "",
    phone2: "",
};

interface CustomerFormProps {
    customer: Customer;
    children: React.ReactNode;
    returnToOrder?: boolean;
    phoneFromQuery?: string;
}

export function CustomerForm({ customer, children, returnToOrder = false, phoneFromQuery = "" }: CustomerFormProps) {
    const { fetch } = useFetchClient();
    const { toast } = useToast();
    const router = useRouter();
    const [loading, setLoading] = useState<boolean>(false);
    const [checkingPhone, setCheckingPhone] = useState<{ phone: boolean; phone2: boolean }>({
        phone: false,
        phone2: false,
    });

    const isNewCustomer = useMemo<boolean>(() => {
        return !customer?.id || customer.id === "" || customer.id === "new";
    }, [customer]);

    const checkPhoneExists = async (phone: string, fieldName: "phone" | "phone2") => {
        const cleanPhone = parseNumber(phone);

        if (!cleanPhone || cleanPhone.length < 10) {
            formCustomer.clearErrors(fieldName);
            return;
        }

        const originalPhone = fieldName === "phone" ? customer?.phone : customer?.phone2;
        const phoneChanged = originalPhone !== cleanPhone;

        if (!isNewCustomer && !phoneChanged) {
            formCustomer.clearErrors(fieldName);
            return;
        }

        setCheckingPhone((prev) => ({ ...prev, [fieldName]: true }));

        try {
            const data = await fetch<{ customers: Customer[] }>(customerEndpoints.findByPhone(cleanPhone));
            const existingCustomer = data?.customers?.[0];

            if (existingCustomer) {
                const isDifferentCustomer = !customer?.id || existingCustomer.id !== customer.id;
                if (isDifferentCustomer) {
                    formCustomer.setError(fieldName, {
                        type: "manual",
                        message: `Já existe um cliente cadastrado com este telefone: ${existingCustomer.name}`,
                    });
                } else {
                    formCustomer.clearErrors(fieldName);
                }
            } else {
                formCustomer.clearErrors(fieldName);
            }
        } catch (error) {
            console.error("Erro ao verificar telefone:", error);
        } finally {
            setCheckingPhone((prev) => ({ ...prev, [fieldName]: false }));
        }
    };

    const formCustomer = useForm<z.infer<typeof customerSchema>>({
        resolver: zodResolver(customerSchema),
        defaultValues,
    });

    useEffect(() => {
        formCustomer.reset({
            id: customer?.id,
            name: customer?.name || "",
            email: customer?.email || "",
            phone: phoneFromQuery || customer?.phone || "",
            phone2: customer?.phone2 || "",
        });
    }, [customer, formCustomer, phoneFromQuery]);

    const handleSubmit = async (values: z.infer<typeof customerSchema>) => {
        const customerUpdated: Customer = {
            id: customer?.id,
            name: values.name,
            email: values.email,
            phone: values.phone,
            phone2: values.phone2,
        };

        const url = customer?.id
            ? `${process.env.NEXT_PUBLIC_HOST_API}/customers/${customer.id}`
            : `${process.env.NEXT_PUBLIC_HOST_API}/customers`;

        const method = customer?.id ? "PUT" : "POST";

        const newCustomer = await fetch<Customer>(url, {
            method,
            body: JSON.stringify(customerUpdated),
        });

        if (customer?.id) {
            formCustomer.reset(customerUpdated);
        } else {
            router.replace(`/customers/${newCustomer?.id}?returnToOrder=true&phone=${newCustomer?.phone}`);
        }

        toast({
            variant: "success",
            description: `Cliente ${customer?.id ? "atualizado" : "inserido"} com sucesso`,
        });
    };

    const handleDelete = async () => {
        setLoading(true);

        await fetch(`${process.env.NEXT_PUBLIC_HOST_API}/customers/${customer.id}`, {
            method: "DELETE",
        });

        toast({
            variant: "success",
            description: "Cliente excluído com sucesso",
        });

        router.back();
    };

    const handleBack = async () => {
        if (returnToOrder && phoneFromQuery) {
            router.push(`/orders/new?phone=${phoneFromQuery}&returnToOrder=true`);
            return;
        }

        router.back();
    };

    const currentName = formCustomer.watch("name");
    const customerInitials =
        currentName
            ?.split(" ")
            .filter((n) => n.length > 0)
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2) || "DC";

    return (
        <div className="flex flex-col gap-10">
            <Form {...formCustomer}>
                <form id="customer-form" onSubmit={formCustomer.handleSubmit(handleSubmit)} className="grid gap-5">
                    <Card>
                        <CardHeaderWithIcon icon={User} title="Dados do Cliente" />
                        <CardContent className="flex flex-col md:flex-row items-center md:items-start gap-6">
                            <Avatar className="h-16 w-16">
                                <AvatarImage src="" />
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                                    {customerInitials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 w-full grid md:grid-cols-2 gap-6">
                                <FormField
                                    control={formCustomer.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                Nome *
                                            </FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={formCustomer.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <Mail className="h-4 w-4" />
                                                Email
                                            </FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={formCustomer.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <Phone className="h-4 w-4" />
                                                Telefone *
                                            </FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        {...field}
                                                        value={formatPhone(field.value)}
                                                        onChange={(e) => {
                                                            const rawValue = parseNumber(e.target.value);
                                                            field.onChange(rawValue);
                                                            // Limpa erro ao digitar
                                                            if (formCustomer.formState.errors.phone) {
                                                                formCustomer.clearErrors("phone");
                                                            }
                                                        }}
                                                        onBlur={async (e) => {
                                                            field.onBlur();
                                                            await checkPhoneExists(e.target.value, "phone");
                                                        }}
                                                        disabled={checkingPhone.phone}
                                                    />
                                                    {checkingPhone.phone && (
                                                        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                                                    )}
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={formCustomer.control}
                                    name="phone2"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <Phone className="h-4 w-4" />
                                                Telefone 2
                                            </FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        {...field}
                                                        value={formatPhone(field.value)}
                                                        onChange={(e) => {
                                                            const rawValue = parseNumber(e.target.value);
                                                            field.onChange(rawValue);
                                                            if (formCustomer.formState.errors.phone2) {
                                                                formCustomer.clearErrors("phone2");
                                                            }
                                                        }}
                                                        onBlur={async (e) => {
                                                            field.onBlur();
                                                            if (e.target.value) {
                                                                await checkPhoneExists(e.target.value, "phone2");
                                                            }
                                                        }}
                                                        disabled={checkingPhone.phone2}
                                                    />
                                                    {checkingPhone.phone2 && (
                                                        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                                                    )}
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="mt-5">
                            <div className="flex justify-end gap-4 w-full">
                                <Button variant="ghost" type="button" onClick={handleBack}>
                                    <ArrowLeft />
                                    Voltar
                                </Button>
                                <Button
                                    type="submit"
                                    form="customer-form"
                                    disabled={[
                                        formCustomer.formState.isSubmitting,
                                        !formCustomer.formState.isDirty,
                                    ].includes(true)}
                                >
                                    {formCustomer.formState.isSubmitting ? (
                                        <Loader2 className="animate-spin" />
                                    ) : customer.id ? (
                                        <Pencil />
                                    ) : (
                                        <Plus />
                                    )}
                                    {customer.id ? "Salvar" : "Adicionar"}
                                </Button>
                                {customer.id && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" type="button" disabled={loading}>
                                                <Trash2 />
                                                Excluir
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>
                                                    Tem certeza que quer excluir esse cliente?
                                                </AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Essa ação não pode ser desfeita.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction asChild>
                                                    <Button
                                                        variant="destructive"
                                                        type="button"
                                                        onClick={handleDelete}
                                                        disabled={loading}
                                                    >
                                                        Continuar
                                                    </Button>
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </div>
                        </CardFooter>
                    </Card>
                </form>
            </Form>

            {customer.id && children}
        </div>
    );
}
