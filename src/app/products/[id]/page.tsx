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
import { Avatar, AvatarFallback, AvatarImage, Card, CardContent } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CardHeaderWithIcon } from "@/components/card-header-with-icon";
import { Category } from "@/domains";
import { Product, productSchema, UnityType } from "@/domains/product";
import { useToast } from "@/hooks/use-toast";
import { useFetchClient } from "@/lib/fetch-client";
import { formatCurrency, parseNumber } from "@/lib/utils";
import { categoryEndpoints } from "@/repository/categoryRepository";
import { productEndpoints } from "@/repository/productRepository";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Pencil, Plus, Trash2, Package, DollarSign, Ruler, Tag } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

export default function ProductDetail() {
    const { fetch } = useFetchClient();
    const router = useRouter();
    const { id } = useParams();
    const [product, setProduct] = useState<Product | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const { toast } = useToast();

    const form = useForm<Product>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            id: undefined,
            value: 0,
            name: "",
            unityType: "KG",
            categoryId: "",
        },
    });

    useEffect(() => {
        if (id === "new") {
            setProduct({
                id: "new",
                value: 0,
                unityType: "KG",
                name: "",
                categoryId: "",
            });
            return;
        }

        const fetchProduct = async () => {
            const data = await fetch<Product>(productEndpoints.get(id as string));
            form.reset({
                id: data?.id,
                value: data?.value,
                name: data?.name,
                unityType: data?.unityType,
                categoryId: data?.categoryId,
            });
            setProduct(data);
        };
        fetchProduct();
    }, [id, form, fetch]);

    useEffect(() => {
        const fetchCategories = async () => {
            const dataCategories = await fetch<Category[]>(categoryEndpoints.list());
            setCategories(dataCategories || []);
        };
        fetchCategories();
    }, [fetch, setCategories]);

    const onSubmit = async (values: Product) => {
        const productUpdated: Product = {
            id: product?.id || "",
            value: values.value,
            name: values.name,
            unityType: values.unityType,
            categoryId: values.categoryId,
        };

        const url = product?.id === "new" ? productEndpoints.create() : productEndpoints.update(id as string);

        const method = product?.id === "new" ? "POST" : "PUT";

        await fetch(url, {
            method,
            body: JSON.stringify(productUpdated),
        });

        setProduct(productUpdated);

        if (product?.id === "new") {
            form.reset({ value: 0, name: "", unityType: "KG" });
        } else {
            form.reset({ ...productUpdated, value: productUpdated.value });
        }

        toast({
            variant: "success",
            description: `Produto ${product?.id === "new" ? "inserido" : "atualizado"}`,
        });
    };

    const handleDelete = async () => {
        setLoading(true);

        await fetch(productEndpoints.delete(id as string), {
            method: "DELETE",
        });

        toast({
            variant: "success",
            description: "Produto excluído com sucesso",
        });

        router.back();
    };

    if (!product) return <div>Loading...</div>;

    const currentName = form.watch("name");
    const productInitials =
        currentName
            ?.split(" ")
            .filter((n) => n.length > 0)
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2) || "DP";

    return (
        <div className="flex flex-col gap-10">
            <Form {...form}>
                <form id="product-form" onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
                    <Card>
                        <CardHeaderWithIcon icon={Package} title="Dados do Produto" />
                        <CardContent className="flex flex-col md:flex-row items-center md:items-start gap-6">
                            <Avatar className="h-16 w-16">
                                <AvatarImage src="" />
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                                    {productInitials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 w-full grid md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <Package className="h-4 w-4" />
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
                                    control={form.control}
                                    name="value"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <DollarSign className="h-4 w-4" />
                                                Valor *
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    inputMode="numeric"
                                                    {...field}
                                                    value={formatCurrency(field.value.toString())}
                                                    onChange={(e) => {
                                                        const rawValue = parseInt(parseNumber(e.target.value));
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
                                    name="unityType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <Ruler className="h-4 w-4" />
                                                Tipo de Unidade *
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione o tipo de unidade do produto" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {Object.keys(UnityType).map((key) => (
                                                        <SelectItem key={key} value={key}>
                                                            {UnityType[key as keyof typeof UnityType]}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="categoryId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <Tag className="h-4 w-4" />
                                                Categoria *
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione a categoria do produto" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {categories.length === 0 ? (
                                                        <SelectItem value="no-category" disabled>
                                                            Não há categorias
                                                        </SelectItem>
                                                    ) : (
                                                        categories.map((category) => (
                                                            <SelectItem key={category.id} value={category.id}>
                                                                {category.name}
                                                            </SelectItem>
                                                        ))
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </Form>

            <div className="flex justify-end gap-4">
                <Button variant="ghost" type="button" onClick={() => router.back()}>
                    <ArrowLeft />
                    Voltar
                </Button>
                <Button
                    variant="secondary"
                    type="submit"
                    form="product-form"
                    disabled={[form.formState.isSubmitting, !form.formState.isDirty].includes(true)}
                >
                    {form.formState.isSubmitting ? (
                        <Loader2 className="animate-spin" />
                    ) : product?.id === "new" ? (
                        <Plus />
                    ) : (
                        <Pencil />
                    )}
                    {product?.id === "new" ? "Adicionar" : "Salvar"}
                </Button>
                {product.id !== "new" && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" type="button" disabled={loading}>
                                <Trash2 />
                                Excluir
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Tem certeza que quer excluir esse produto?</AlertDialogTitle>
                                <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
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
