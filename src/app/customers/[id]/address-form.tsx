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
import { useFetchClient } from "@/lib/fetch-client";
import { Input } from "@/components/ui/input";
import { Address, addressSchema } from "@/domains";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

interface AddressFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Address) => Promise<void>;
  address?: Address;
  isEditing: boolean;
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
  onOpenChange,
  onSubmit,
  address,
  isEditing,
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
    onOpenChange(false);
  };

  const handleSubmit = async (data: Address) => {
    try {
      const formData = {
        ...data,
        distance: Number(data.distance) || 0,
      };

      if (data.customerId) {
        const url = data?.id
          ? `${process.env.NEXT_PUBLIC_HOST_API}/addresses/${data.id}`
          : `${process.env.NEXT_PUBLIC_HOST_API}/addresses`;

        const method = data?.id ? "PUT" : "POST";

        await fetch(url, {
          method,
          body: JSON.stringify(data),
        });
      }

      await onSubmit(formData);
      handleCloseForm();
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
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
                            onChange={(e) => {
                              console.log(formEditAddress.formState.errors);
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
