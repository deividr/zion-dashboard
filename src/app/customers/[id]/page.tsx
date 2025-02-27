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
import { Customer } from "../columns";

const phoneSchema = z.string().max(11, { message: "Telefone inválido" });

const formSchema = z.object({
  name: z.string().min(5, { message: "Nome deve ter no mínimo 5 caracteres" }),
  email: z.string().email("Email inválido").or(z.literal("")),
  phone: phoneSchema.min(10, { message: "Telefone inválido" }),
  phone2: phoneSchema,
});

export default function CustomerDetail() {
  const { fetch } = useFetchClient();
  const router = useRouter();
  const { id } = useParams();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      phone2: "",
    },
  });

  useEffect(() => {
    if (id === "new") {
      setCustomer({ id: "new", name: "", email: "", phone: "", phone2: "" });
      return;
    }

    const fetchCustomer = async () => {
      const data = await fetch(
        `${process.env.NEXT_PUBLIC_HOST_API}/customers/${id}`,
      );
      form.reset({
        name: data.name,
        email: data.email || "",
        phone: data.phone || "",
        phone2: data.phone2 || "",
      });
      setCustomer(data);
    };
    fetchCustomer();
  }, [id, form, fetch]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
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
      form.reset({ name: "", email: "", phone: "", phone2: "" });
    } else {
      form.reset(customerUpdated);
    }

    toast({
      variant: "success",
      description: `Cliente ${
        customer?.id === "new" ? "inserido" : "atualizado"
      } com sucesso`,
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
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="container mx-auto flex flex-col gap-5"
      >
        <h1 className="text-2xl font-bold">
          Cliente{" "}
          {customer?.id !== "new" && (
            <span className="text-orange-600">{customer.name}</span>
          )}
        </h1>
        <div className="grid w-full max-w-sm items-center gap-6">
          <FormField
            control={form.control}
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
            control={form.control}
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
            control={form.control}
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
            control={form.control}
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
                form.formState.isSubmitting,
                !form.formState.isDirty,
              ].includes(true)}
            >
              {form.formState.isSubmitting ? (
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
  );
}
