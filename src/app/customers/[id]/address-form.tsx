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
import { toast } from "@/hooks/use-toast";
import { useFetchClient } from "@/lib/fetch-client";
import { fetchCepData, formatCep, parseNumber } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect } from "react";
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
  const formEditAddress = useForm<Address>({
    resolver: zodResolver(addressSchema),
    defaultValues,
  });

  useEffect(() => {
    if (address) {
      formEditAddress.reset({
        ...address,
        distance: Number(address.distance) || 0,
      });
    } else {
      formEditAddress.reset(defaultValues);
    }
  }, [address, formEditAddress]);

  const handleCloseForm = () => {
    formEditAddress.reset();
    onOpenChangeAction(false);
  };

  const handleSubmit = async (data: Address) => {
    if (customer.id) {
      const url = address?.id
        ? `${process.env.NEXT_PUBLIC_HOST_API}/addresses/${address.id}`
        : `${process.env.NEXT_PUBLIC_HOST_API}/addresses`;

      const method = address?.id ? "PUT" : "POST";

      const result = await fetch<Address>(url, {
        method,
        body: JSON.stringify({
          ...data,
          customerId: customer.id,
        }),
      });

      data.id = result?.id;

      toast({
        variant: "success",
        description: `Endereço ${
          isEditing ? "atualizado" : "adicionado"
        } com sucesso!`,
      });
    }

    await onSubmitAction(data);
    handleCloseForm();
  };

  const handleCepBlur = useCallback(
    async (e: React.FocusEvent<HTMLInputElement>) => {
      const cep = e.target.value.replace(/\D/g, "");
      if (cep.length === 8) {
        try {
          const data = await fetchCepData(cep);
          formEditAddress.setValue("street", data.street);
          formEditAddress.setValue("neighborhood", data.neighborhood);
          formEditAddress.setValue("city", data.city);
          formEditAddress.setValue("state", data.state);
          formEditAddress.clearErrors("cep");
        } catch {
          formEditAddress.setError("cep", {
            type: "manual",
            message: "CEP inválido ou não encontrado",
          });
        }
      }
    },
    [formEditAddress]
  );

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChangeAction}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isEditing ? "Editar Endereço" : "Adicionar Endereço"}
          </AlertDialogTitle>
        </AlertDialogHeader>

        <Form {...formEditAddress}>
          <form onSubmit={formEditAddress.handleSubmit(handleSubmit)}>
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
                          <Input
                            {...field}
                            value={formatCep(field.value || "")}
                            onChange={(e) => {
                              const rawValue = parseNumber(e.target.value);
                              if (rawValue.length < 9) {
                                field.onChange(rawValue);
                              }
                            }}
                            onBlur={(e) => {
                              if (e.target.value.length === 9) {
                                handleCepBlur(e);
                              }
                            }}
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
                          <Input
                            type="number"
                            {...field}
                            value={Number(field.value)}
                            onChange={(e) => {
                              const value =
                                e.target.value === ""
                                  ? 0
                                  : Number(e.target.value);
                              field.onChange(value);
                            }}
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
              <AlertDialogCancel onClick={handleCloseForm}>
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
  );
}
