"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
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
import { Address, addressSchema, Customer } from "@/domains";
import { useToast } from "@/hooks/use-toast";
import { useFetchClient } from "@/lib/fetch-client";
import { useHeaderStore } from "@/stores/header-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { CustomerForm } from "./customer-form";

export default function CustomerDetail() {
  const { fetch } = useFetchClient();
  const { id } = useParams();
  const [showAddressForm, setShowAddressForm] = useState<boolean>(false);
  const [editingAddressIndex, setEditingAddressIndex] = useState<number | null>(
    null
  );
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const setTitle = useHeaderStore((state) => state.setTitle);
  const { toast } = useToast();

  useEffect(() => {
    setTitle(["Clientes", id !== "new" ? "Atualizar Cliente" : "Novo Cliente"]);
  }, [setTitle, id]);

  const formEditAddress = useForm<Address>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      cep: "",
      street: "",
      number: "",
      neighborhood: "",
      city: "",
      state: "",
      aditionalDetails: "",
      isDefault: false,
      distance: 0,
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
      setCustomer(customer);
      setAddresses(addresses);
    };
    fetchCustomer();
  }, [id, fetch]);

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

  if (!customer) return <div>Loading...</div>;

  return (
    <>
      <CustomerForm customer={customer} />

      {/* Seção de Endereços */}
      <div className="grid gap-5 mt-20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Endereços</h2>
          <Button
            type="button"
            onClick={() => {
              setEditingAddressIndex(null);
              formEditAddress.reset();
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

      <AlertDialog open={showAddressForm} onOpenChange={setShowAddressForm}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {editingAddressIndex !== null
                ? "Editar Endereço"
                : "Adicionar Endereço"}
            </AlertDialogTitle>
          </AlertDialogHeader>

          <Form {...formEditAddress}>
            <form onSubmit={formEditAddress.handleSubmit(onSubmitAddress)}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <FormField
                      control={formEditAddress.control}
                      name="cep"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CEP</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

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
                              value={field.value?.toUpperCase() ?? ""}
                              onChange={(e) =>
                                field.onChange(e.target.value.toUpperCase())
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
                      name="distance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Distância</FormLabel>
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
                              checked={field.value ?? false}
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
    </>
  );
}
