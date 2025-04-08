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
import { Address, Customer, addressSchema } from "../columns";
import { useHeaderStore } from "@/stores/header-store";

const phoneSchema = z.string().max(11, { message: "Telefone inválido" });

const formCustomerSchema = z.object({
  name: z.string().min(5, { message: "Nome deve ter no mínimo 5 caracteres" }),
  email: z.string().email("Email inválido").or(z.literal("")),
  phone: phoneSchema.min(10, { message: "Telefone inválido" }),
  phone2: phoneSchema,
  addresses: z.array(addressSchema).default([]),
});

export default function CustomerDetail() {
  const { fetch } = useFetchClient();
  const router = useRouter();
  const { id } = useParams();
  const [showAddressForm, setShowAddressForm] = useState<boolean>(false);
  const [editingAddressIndex, setEditingAddressIndex] = useState<number | null>(
    null
  );
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const { toast } = useToast();
  const setTitle = useHeaderStore((state) => state.setTitle);

  useEffect(() => {
    setTitle(["Clientes", id !== "new" ? "Atualizar Cliente" : "Novo Cliente"]);
  }, [setTitle, id]);

  const formCustomer = useForm<z.infer<typeof formCustomerSchema>>({
    resolver: zodResolver(formCustomerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      phone2: "",
    },
  });

  const formEditAddress = useForm<Address>({
    resolver: zodResolver(addressSchema),
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
      setCustomer(customer);
      setAddresses(addresses);
    };
    fetchCustomer();
  }, [id, formCustomer, fetch]);

  const onSubmitCustomer = async (
    values: z.infer<typeof formCustomerSchema>
  ) => {
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
      description: `Cliente ${
        customer?.id === "new" ? "inserido" : "atualizado"
      } com sucesso`,
    });
  };

  const onSubmitAddress = async (data: Address) => {
    const updatedAddresses = [...addresses];

    if (editingAddressIndex !== null) {
      updatedAddresses[editingAddressIndex] = data;
    } else {
      updatedAddresses.push(data);
    }

    if (data.isDefault) {
      updatedAddresses.forEach((addr, index) => {
        if (index !== editingAddressIndex) {
          addr.isDefault = false;
        }
      });
    }

    const url =
      data?.id === "new"
        ? `${process.env.NEXT_PUBLIC_HOST_API}/addresses`
        : `${process.env.NEXT_PUBLIC_HOST_API}/addresses/${id}`;

    const method = customer?.id === "new" ? "POST" : "PUT";

    await fetch(url, {
      method,
      body: JSON.stringify(data),
    });

    setAddresses(updatedAddresses);
    setShowAddressForm(false);
    setEditingAddressIndex(null);
    formEditAddress.reset();
    toast({
      variant: "success",
      description: "Endereço atualizado com sucesso!",
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
          onSubmit={formCustomer.handleSubmit(onSubmitCustomer)}
          className="grid gap-5"
        >
          <h1 className="text-2xl font-bold">
            {customer?.id !== "new" && <span>{customer.name}</span>}
          </h1>
          <div className="grid md:grid-cols-2 gap-6">
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
          </div>
          <div className="flex justify-end gap-4">
            <Button variant="ghost" type="button" onClick={() => router.back()}>
              <ArrowLeft />
              Voltar
            </Button>
            <Button
              variant="secondary"
              type="submit"
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
                    variant="destructive"
                    type="button"
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
        </form>
      </Form>

      {/* Seção de Endereços */}
      <div className="grid gap-5 mt-20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Endereços</h2>
          <Button
            type="button"
            onClick={() => {
              setEditingAddressIndex(null);
              formEditAddress.reset({
                id: "new",
                street: "",
                number: "",
                neighborhood: "",
                city: "",
                state: "",
              });
              setShowAddressForm(true);
            }}
          >
            Adicionar Endereço
          </Button>
        </div>

        {/* Lista de Endereços */}
        <div className="space-y-4 mb-6">
          {!addresses?.length ? (
            <div className="text-center py-8 border border-dashed rounded-md text-muted-foreground">
              Nenhum endereço cadastrado
            </div>
          ) : (
            addresses?.map((address, index) => (
              <div
                key={address.id || index}
                className="p-4 border rounded-md shadow-sm hover:shadow-md transition-all bg-card"
              >
                <div className="flex justify-between items-center">
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
                      {address.aditionalDetails &&
                        ` - ${address.aditionalDetails}`}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        formEditAddress.reset(address);
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
                        addresses.splice(index, 1);
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

      <Form {...formEditAddress}>
        <form onSubmit={formEditAddress.handleSubmit(onSubmitAddress)}>
          {/* Modal de Formulário de Endereço */}
          {showAddressForm && (
            <AlertDialog
              open={showAddressForm}
              onOpenChange={setShowAddressForm}
            >
              <AlertDialogContent className="max-w-md">
                <Form {...formEditAddress}>
                  <form
                    onSubmit={formEditAddress.handleSubmit(onSubmitAddress)}
                  >
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {editingAddressIndex !== null
                          ? "Editar Endereço"
                          : "Adicionar Endereço"}
                      </AlertDialogTitle>
                    </AlertDialogHeader>

                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <FormField
                            control={formEditAddress.control}
                            name="street"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Rua</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div>
                          <FormField
                            control={formEditAddress.control}
                            name="number"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Número</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div>
                          <FormField
                            control={formEditAddress.control}
                            name="neighborhood"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Bairro</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div>
                          <FormField
                            control={formEditAddress.control}
                            name="city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Cidade</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div>
                          <FormField
                            control={formEditAddress.control}
                            name="state"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Estado</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    maxLength={2}
                                    value={field.value?.toUpperCase()}
                                    onChange={(e) =>
                                      field.onChange(
                                        e.target.value.toUpperCase()
                                      )
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="col-span-2">
                          <FormField
                            control={formEditAddress.control}
                            name="aditionalDetails"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Complemento</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="col-span-2">
                          <FormField
                            control={formEditAddress.control}
                            name="isDefault"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                <FormControl>
                                  <input
                                    type="checkbox"
                                    checked={field.value}
                                    onChange={field.onChange}
                                    className="h-4 w-4"
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-medium">
                                  Definir como endereço principal
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>

                    <AlertDialogFooter>
                      <AlertDialogCancel
                        onClick={() => {
                          setShowAddressForm(false);
                          setEditingAddressIndex(null);
                          formEditAddress.reset();
                        }}
                      >
                        Cancelar
                      </AlertDialogCancel>
                      <Button
                        type="submit"
                        disabled={[
                          formEditAddress.formState.isSubmitting,
                          !formEditAddress.formState.isDirty,
                        ].includes(true)}
                      >
                        {formEditAddress.formState.isSubmitting && (
                          <Loader2 className="animate-spin mr-2" />
                        )}
                        Salvar
                      </Button>
                    </AlertDialogFooter>
                  </form>
                </Form>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </form>
      </Form>
    </>
  );
}
