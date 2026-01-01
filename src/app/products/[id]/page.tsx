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
import { Avatar, AvatarFallback, AvatarImage, Card, CardContent, CardFooter } from "@/components/ui";
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
import { ArrowLeft, Loader2, Pencil, Plus, Trash2, Package, DollarSign, Ruler, Tag, Upload, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@clerk/nextjs";
import { compressImage, isValidImageFile, isValidFileSize } from "@/lib/image-compression";
import { uploadImageToBucket } from "@/lib/pre-signed-upload";

export default function ProductDetail() {
    const { fetch } = useFetchClient();
    const { getToken } = useAuth();
    const router = useRouter();
    const { id } = useParams();
    const [product, setProduct] = useState<Product | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [uploadingImage, setUploadingImage] = useState<boolean>(false);
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
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
                imageUrl: data?.imageUrl,
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
            imageUrl: values.imageUrl || undefined,
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

    const handleAvatarClick = () => {
        if (product?.id === "new") {
            toast({
                variant: "destructive",
                description: "Salve o produto antes de fazer upload da imagem",
            });
            return;
        }
        fileInputRef.current?.click();
    };

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validar tipo de arquivo
        if (!isValidImageFile(file)) {
            toast({
                variant: "destructive",
                description: "Por favor, selecione um arquivo de imagem",
            });
            return;
        }

        // Validar tamanho antes da compressão (máximo 10MB)
        if (!isValidFileSize(file, 10)) {
            toast({
                variant: "destructive",
                description: "A imagem deve ter no máximo 10MB",
            });
            return;
        }

        // Criar preview local imediatamente
        const localPreviewUrl = URL.createObjectURL(file);
        setPreviewImageUrl(localPreviewUrl);

        // Iniciar processo de upload (o preview será limpo dentro do handleImageUpload)
        await handleImageUpload(file, localPreviewUrl);
    };

    const handleImageUpload = async (file: File, previewUrl?: string) => {
        if (!product?.id || product.id === "new") {
            toast({
                variant: "destructive",
                description: "Salve o produto antes de fazer upload da imagem",
            });
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
                setPreviewImageUrl(null);
            }
            return;
        }

        setUploadingImage(true);

        try {
            // 1. Comprimir imagem
            const compressedFile = await compressImage(file);

            // 2. Fazer upload para o bucket
            const publicUrl = await uploadImageToBucket(compressedFile, async () => await getToken());

            // 3. Atualizar estado do produto e formulário
            const updatedProduct = { ...product, imageUrl: publicUrl };
            setProduct(updatedProduct);
            form.setValue("imageUrl", publicUrl, { shouldDirty: true });

            // 4. Limpar preview local após sucesso
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
            setPreviewImageUrl(null);

            toast({
                variant: "success",
                description: "Imagem enviada com sucesso!",
            });
        } catch (error) {
            console.error("Erro ao fazer upload da imagem:", error);
            toast({
                variant: "destructive",
                description: error instanceof Error ? error.message : "Erro ao fazer upload da imagem",
            });
            // Manter preview em caso de erro para tentar novamente
        } finally {
            setUploadingImage(false);
            // Limpar o input para permitir selecionar o mesmo arquivo novamente
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleRemoveImage = async () => {
        if (!product?.id || product.id === "new") {
            return;
        }

        // Limpar preview se houver
        if (previewImageUrl) {
            URL.revokeObjectURL(previewImageUrl);
            setPreviewImageUrl(null);
        }

        // Atualizar estado do produto e formulário
        const updatedProduct = { ...product, imageUrl: undefined };
        setProduct(updatedProduct);
        form.setValue("imageUrl", undefined, { shouldDirty: true });

        toast({
            variant: "success",
            description: "Imagem removida com sucesso!",
        });
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
                            <div className="relative">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    disabled={uploadingImage || product?.id === "new"}
                                />
                                <Avatar
                                    className={`h-16 w-16 transition-opacity ${
                                        uploadingImage
                                            ? "opacity-50 cursor-wait"
                                            : product?.id !== "new"
                                              ? "cursor-pointer hover:opacity-80"
                                              : ""
                                    }`}
                                    onClick={handleAvatarClick}
                                >
                                    <AvatarImage src={previewImageUrl || product.imageUrl} alt={product.name} />
                                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                                        {uploadingImage ? (
                                            <Loader2 className="h-6 w-6 animate-spin" />
                                        ) : (
                                            productInitials
                                        )}
                                    </AvatarFallback>
                                </Avatar>
                                {product?.id !== "new" && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            if (uploadingImage) return;
                                            if (previewImageUrl || product.imageUrl) {
                                                e.stopPropagation();
                                                handleRemoveImage();
                                            } else {
                                                handleAvatarClick();
                                            }
                                        }}
                                        disabled={uploadingImage}
                                        className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1.5 shadow-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-wait"
                                        title={
                                            uploadingImage
                                                ? "Processando imagem..."
                                                : previewImageUrl || product.imageUrl
                                                  ? "Remover imagem"
                                                  : "Fazer upload de imagem"
                                        }
                                    >
                                        {uploadingImage ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : previewImageUrl || product.imageUrl ? (
                                            <X className="h-3 w-3" />
                                        ) : (
                                            <Upload className="h-3 w-3" />
                                        )}
                                    </button>
                                )}
                            </div>
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
                        <CardFooter className="mt-5">
                            <div className="flex justify-end gap-4 w-full">
                                <Button variant="ghost" type="button" onClick={() => router.back()}>
                                    <ArrowLeft />
                                    Voltar
                                </Button>
                                <Button
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
                                                <AlertDialogTitle>
                                                    Tem certeza que quer excluir esse produto?
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
        </div>
    );
}
