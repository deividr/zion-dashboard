"use client";

import {
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Customer, customerSchema } from "@/domains";
import { useToast } from "@/hooks/use-toast";
import { useFetchClient } from "@/lib/fetch-client";
import { formatPhone, parseNumber } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const defaultValues: Customer = {
  name: "",
  email: "",
  phone: "",
  phone2: "",
};

export function CustomerForm({
  customer,
  children,
}: {
  customer: Customer;
  children: React.ReactNode;
}) {
  const { fetch } = useFetchClient();
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);

  const formCustomer = useForm<z.infer<typeof customerSchema>>({
    resolver: zodResolver(customerSchema),
    defaultValues,
  });

  useEffect(() => {
    if (customer?.id) {
      formCustomer.reset({
        id: customer.id,
        name: customer.name,
        email: customer.email || "",
        phone: customer.phone || "",
        phone2: customer.phone2 || "",
      });
    } else {
      formCustomer.reset(defaultValues);
    }
  }, [customer, formCustomer]);

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

    await fetch(url, {
      method,
      body: JSON.stringify(customerUpdated),
    });

    if (customer?.id) {
      formCustomer.reset(customerUpdated);
    } else {
      formCustomer.reset(defaultValues);
    }

    toast({
      variant: "success",
      description: `Cliente ${
        customer?.id ? "atualizado" : "inserido"
      } com sucesso`,
    });
  };

  const handleDelete = async () => {
    setLoading(true);
    await fetch(
      `${process.env.NEXT_PUBLIC_HOST_API}/customers/${customer.id}`,
      {
        method: "DELETE",
      }
    );

    toast({
      variant: "success",
      description: "Cliente excluído com sucesso",
    });

    router.back();
  };

  return (
    <div className="flex flex-col gap-10">
      <Form {...formCustomer}>
        <form
          onSubmit={formCustomer.handleSubmit(handleSubmit)}
          className="grid gap-5"
        >
          <h1 className="text-2xl font-bold">
            {customer?.id && <span>{customer.name}</span>}
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
                        console.log(formCustomer.formState);
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
        </form>
      </Form>

      {customer.id && children}

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
    </div>
  );
}
