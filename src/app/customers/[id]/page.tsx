"use client";

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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useFetchClient } from "@/lib/fetch-client";
import { formatPhone, parseNumber } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Pencil, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Customer, addressSchema } from "../columns";

const phoneSchema = z.string().max(11, { message: "Telefone inválido" });

const formCustomerSchema = z.object({
  name: z.string().min(5, { message: "Nome deve ter no mínimo 5 caracteres" }),
  email: z.string().email("Email inválido").or(z.literal("")),
  phone: phoneSchema.min(10, { message: "Telefone inválido" }),
  phone2: phoneSchema,
  addresses: z.array(addressSchema).default([]),
});

const formAddressSchema = z.object({
  addresses: z.array(addressSchema).default([]),
});

export default function CustomerDetail() {
  const { fetch } = useFetchClient();
  const router = useRouter();
  const { id } = useParams();
  const [showAddressForm, setShowAddressForm] = useState<boolean>(false);
  const [editingAddressIndex, setEditingAddressIndex] = useState<number | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const formCustomer = useForm<z.infer<typeof formCustomerSchema>>({
    resolver: zodResolver(formCustomerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      phone2: "",
    },
  });

  const formAddress = useForm<z.infer<typeof formAddressSchema>>({
    resolver: zodResolver(formAddressSchema),
    defaultValues: {
      addresses: [],
    },
  });

  useEffect(() => {
    if (id === "new") {
      setCustomer({ id: "new", name: "", email: "", phone: "", phone2: "" });
      return;
    }

    const fetchCustomer = async () => {
      const { customer, addresses } = await fetch(
        `${process.env.NEXT_PUBLIC_HOST_API}/customers/${id}`
      );
      formCustomer.reset({
        name: customer.name,
        email: customer.email || "",
        phone: customer.phone || "",
        phone2: customer.phone2 || "",
      });
      formAddress.reset({
        addresses,
      });
      setCustomer(customer);
    };
    fetchCustomer();
  }, [id, formCustomer, formAddress, fetch]);

  const onSubmit = async (values: z.infer<typeof formCustomerSchema>) => {
    const customerUpdated: Customer = {
      id: customer?.id || "",
      name: values.name,
      email: values.email,
      phone: values.phone,
      phone2: values.phone2,
    };

    const url =
      customer?.id === "new"
        ? `${process.env.NEXT_PUBLIC_HOST_API}/customers`
        : `${process.env.NEXT_PUBLIC_HOST_API}/customers/${id}`;

    const method = customer?.id === "new" ? "POST" : "PUT";

    await fetch(url, {
      method,
      body: JSON.stringify(customerUpdated),
    });

    setCustomer(customerUpdated);

    if (customer?.id === "new") {
      formCustomer.reset({ name: "", email: "", phone: "", phone2: "" });
    } else {
      formCustomer.reset(customerUpdated);
    }

    toast({
      variant: "success",
      description: `Cliente ${customer?.id === "new" ? "inserido" : "atualizado"} com sucesso`,
    });
  };

  const handleDelete = async () => {
    setLoading(true);
    await fetch(`${process.env.NEXT_PUBLIC_HOST_API}/customers/${id}`, {
      method: "DELETE",
    });

    toast({
      variant: "success",
      description: "Cliente excluído com sucesso",
    });

    router.back();
  };

  if (!customer) return <div>Loading...</div>;

  return (
    <>
      <Form {...formCustomer}>
        <form
          onSubmit={formCustomer.handleSubmit(onSubmit)}
          className="container mx-auto flex flex-col gap-5"
        >
          <h1 className="text-2xl font-bold">
            Cliente{" "}
            {customer?.id !== "new" && <span className="text-orange-600">{customer.name}</span>}
          </h1>
          <div className="grid w-full max-w-sm items-center gap-6">
            <FormField
              control={formCustomer.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
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
                  <FormLabel>Email</FormLabel>
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
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={formatPhone(field.value)}
                      onChange={(e) => {
                        const rawValue = parseNumber(e.target.value);
                        field.onChange(rawValue);
                      }}
                    />
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
                  <FormLabel>Telefone 2</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={formatPhone(field.value)}
                      onChange={(e) => {
                        const rawValue = parseNumber(e.target.value);
                        field.onChange(rawValue);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-between gap-4 mt-5">
              <Button
                className="flex-1"
                variant="ghost"
                type="button"
                size="lg"
                onClick={() => router.back()}
              >
                <ArrowLeft />
                Voltar
              </Button>
              <Button
                className="flex-1"
                variant="secondary"
                type="submit"
                size="lg"
                disabled={[
                  formCustomer.formState.isSubmitting,
                  !formCustomer.formState.isDirty,
                ].includes(true)}
              >
                {formCustomer.formState.isSubmitting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Pencil />
                )}
                {customer?.id === "new" ? "Adicionar" : "Salvar"}
              </Button>
              {customer.id !== "new" && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      className="flex-1"
                      variant="destructive"
                      type="button"
                      size="lg"
                      disabled={loading}
                    >
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
                          size="lg"
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
          </div>
        </form>
      </Form>

      <Form {...formAddress}>
        <form className="container mx-auto flex flex-col gap-5">
          {/* Seção de Endereços */}
          <div className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Endereços</h2>
              <Button
                type="button"
                variant="gradient"
                onClick={() => {
                  setEditingAddressIndex(null);
                  setShowAddressForm(true);
                }}
              >
                Adicionar Endereço
              </Button>
            </div>

            {/* Lista de Endereços */}
            <div className="space-y-4 mb-6">
              {!formAddress.watch("addresses")?.length ? (
                <div className="text-center py-8 border border-dashed rounded-md text-muted-foreground">
                  Nenhum endereço cadastrado
                </div>
              ) : (
                formAddress.watch("addresses")?.map((address, index) => (
                  <div
                    key={address.id || index}
                    className="p-4 border rounded-md shadow-sm hover:shadow-md transition-all bg-card"
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">
                            {address.street}, {address.number}
                          </h3>
                          {address.isDefault && (
                            <span className="bg-primary/20 text-primary text-xs px-2 py-1 rounded-full">
                              Principal
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {address.neighborhood}, {address.city} - {address.state}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          CEP: {address.cep.replace(/(\d{5})(\d{3})/, "$1-$2")}
                          {address.aditionalDetails && ` - ${address.aditionalDetails}`}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setEditingAddressIndex(index);
                            setShowAddressForm(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            const addresses = [...formAddress.getValues("addresses")];
                            addresses.splice(index, 1);
                            formAddress.setValue("addresses", addresses, { shouldDirty: true });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Modal de Formulário de Endereço */}
          {showAddressForm && (
            <AlertDialog open={showAddressForm} onOpenChange={setShowAddressForm}>
              <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {editingAddressIndex !== null ? "Editar Endereço" : "Adicionar Endereço"}
                  </AlertDialogTitle>
                </AlertDialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <FormLabel htmlFor="street">Rua</FormLabel>
                      <Input
                        id="street"
                        value={
                          editingAddressIndex !== null
                            ? formCustomer.getValues(`addresses.${editingAddressIndex}.street`)
                            : ""
                        }
                        onChange={(e) => {
                          if (editingAddressIndex !== null) {
                            formCustomer.setValue(
                              `addresses.${editingAddressIndex}.street`,
                              e.target.value,
                              {
                                shouldDirty: true,
                              }
                            );
                          }
                        }}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <FormLabel htmlFor="number">Número</FormLabel>
                      <Input
                        id="number"
                        value={
                          editingAddressIndex !== null
                            ? formCustomer.getValues(`addresses.${editingAddressIndex}.number`)
                            : ""
                        }
                        onChange={(e) => {
                          if (editingAddressIndex !== null) {
                            formCustomer.setValue(
                              `addresses.${editingAddressIndex}.number`,
                              e.target.value,
                              {
                                shouldDirty: true,
                              }
                            );
                          }
                        }}
                      />
                    </div>

                    <div>
                      <FormLabel htmlFor="neighborhood">Bairro</FormLabel>
                      <Input
                        id="neighborhood"
                        value={
                          editingAddressIndex !== null
                            ? formCustomer.getValues(
                                `addresses.${editingAddressIndex}.neighborhood`
                              )
                            : ""
                        }
                        onChange={(e) => {
                          if (editingAddressIndex !== null) {
                            formCustomer.setValue(
                              `addresses.${editingAddressIndex}.neighborhood`,
                              e.target.value,
                              { shouldDirty: true }
                            );
                          }
                        }}
                      />
                    </div>

                    <div>
                      <FormLabel htmlFor="city">Cidade</FormLabel>
                      <Input
                        id="city"
                        value={
                          editingAddressIndex !== null
                            ? formCustomer.getValues(`addresses.${editingAddressIndex}.city`)
                            : ""
                        }
                        onChange={(e) => {
                          if (editingAddressIndex !== null) {
                            formCustomer.setValue(
                              `addresses.${editingAddressIndex}.city`,
                              e.target.value,
                              {
                                shouldDirty: true,
                              }
                            );
                          }
                        }}
                      />
                    </div>

                    <div>
                      <FormLabel htmlFor="state">Estado</FormLabel>
                      <Input
                        id="state"
                        maxLength={2}
                        value={
                          editingAddressIndex !== null
                            ? formCustomer.getValues(`addresses.${editingAddressIndex}.state`)
                            : ""
                        }
                        onChange={(e) => {
                          if (editingAddressIndex !== null) {
                            formCustomer.setValue(
                              `addresses.${editingAddressIndex}.state`,
                              e.target.value.toUpperCase(),
                              { shouldDirty: true }
                            );
                          }
                        }}
                      />
                    </div>

                    <div className="col-span-2">
                      <FormLabel htmlFor="complement">Complemento</FormLabel>
                      <Input
                        id="complement"
                        value={
                          editingAddressIndex !== null
                            ? formCustomer.getValues(
                                `addresses.${editingAddressIndex}.aditionalDetails`
                              ) || ""
                            : ""
                        }
                        onChange={(e) => {
                          if (editingAddressIndex !== null) {
                            formCustomer.setValue(
                              `addresses.${editingAddressIndex}.aditionalDetails`,
                              e.target.value,
                              { shouldDirty: true }
                            );
                          }
                        }}
                      />
                    </div>

                    <div className="col-span-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="isDefault"
                          checked={
                            editingAddressIndex !== null
                              ? formCustomer.getValues(`addresses.${editingAddressIndex}.isDefault`)
                              : false
                          }
                          onChange={(e) => {
                            if (editingAddressIndex !== null) {
                              formCustomer.setValue(
                                `addresses.${editingAddressIndex}.isDefault`,
                                e.target.checked,
                                { shouldDirty: true }
                              );
                            }
                          }}
                          className="h-4 w-4"
                        />
                        <label htmlFor="isDefault" className="text-sm font-medium">
                          Definir como endereço principal
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowAddressForm(false);
                    }}
                  >
                    Salvar
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </form>
      </Form>
    </>
  );
}
