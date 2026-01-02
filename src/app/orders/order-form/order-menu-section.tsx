"use client";

import { ProductCard } from "@/components/product-card";
import { Card, CardContent, Input, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import { Category, OrderSubproduct, Product } from "@/domains";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { OrderFormData } from ".";

interface OrderMenuSectionProps {
    form: UseFormReturn<OrderFormData>;
    products: Product[];
    categories: Category[];
    subProducts: OrderSubproduct[];
    isMassasProductAction: (product: Product) => boolean;
}

export function OrderMenuSection({
    form,
    products,
    categories,
    subProducts,
    isMassasProductAction,
}: OrderMenuSectionProps) {
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");

    // Ordem específica das categorias para os tabs
    const orderedCategories = useMemo(() => {
        const categoryOrder = ["Massas", "Carnes", "Bebidas", "Diversos"];
        const ordered: Category[] = [];
        const others: Category[] = [];

        // Adicionar categorias na ordem especificada
        categoryOrder.forEach((categoryName) => {
            const category = categories.find((c) => c.name === categoryName);
            if (category) {
                ordered.push(category);
            }
        });

        // Adicionar outras categorias que não estão na lista
        categories.forEach((category) => {
            if (!categoryOrder.includes(category.name || "")) {
                others.push(category);
            }
        });

        return [...ordered, ...others].slice(0, 4);
    }, [categories]);

    // Produtos filtrados por busca e categoria
    const filteredProducts = useMemo(() => {
        let filtered = products;

        // Filtrar por busca
        if (search) {
            filtered = filtered.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
        }

        // Filtrar por categoria
        if (selectedCategory !== "all") {
            filtered = filtered.filter((p) => p.categoryId === selectedCategory);
        }

        return filtered;
    }, [products, search, selectedCategory]);

    // Produtos agrupados por categoria
    const productsByCategory = useMemo(() => {
        const grouped = new Map<string, Product[]>();

        filteredProducts.forEach((product) => {
            const category = categories.find((c) => c.id === product.categoryId);
            const categoryName = category?.name || "Outros";

            if (!grouped.has(categoryName)) {
                grouped.set(categoryName, []);
            }
            grouped.get(categoryName)!.push(product);
        });

        return Array.from(grouped.entries());
    }, [filteredProducts, categories]);

    // Adicionar produto ao carrinho
    const handleAddToCart = (product: Product, quantity: number, selectedSubProducts: string[]) => {
        const currentProducts = form.getValues("products") || [];

        // Adicionar novo produto sempre (permite múltiplas variações do mesmo produto)
        form.setValue("products", [
            ...currentProducts,
            {
                productId: product.id!,
                name: product.name,
                unityType: product.unityType,
                quantity,
                price: product.value,
                subProducts: selectedSubProducts.map((p) => ({
                    productId: p,
                })),
            },
        ]);
    };

    return (
        <Card className="h-[calc(100vh-200px)] flex flex-col overflow-hidden">
            <CardContent className="p-6 flex flex-col gap-4 h-full overflow-hidden">
                {/* Search */}
                <div className="relative flex-shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar produto..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>

                {/* Category Tabs */}
                <Tabs
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                    className="flex-1 flex flex-col min-h-0 overflow-hidden"
                >
                    <TabsList className="grid w-full grid-cols-5 gap-2 flex-shrink-0">
                        <TabsTrigger value="all">Todos</TabsTrigger>
                        {orderedCategories.map((category) => (
                            <TabsTrigger key={category.id} value={category.id || ""}>
                                {category.name}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <TabsContent value={selectedCategory} className="flex-1 overflow-y-auto mt-4 pr-2 -mr-2">
                        <div className="space-y-4 pr-2">
                            {selectedCategory === "all" ? (
                                // Mostrar produtos agrupados por categoria
                                productsByCategory.map(([categoryName, categoryProducts]) => (
                                    <div key={categoryName} className="space-y-3">
                                        <h3 className="text-lg font-semibold sticky top-0 bg-background py-2 z-10">
                                            {categoryName}
                                        </h3>
                                        <div className="space-y-3">
                                            {categoryProducts.map((product, index) => {
                                                const shouldShowSubProducts = isMassasProductAction(product);
                                                const isPriority = index < 2 && !!product.imageUrl;
                                                return (
                                                    <ProductCard
                                                        key={product.id}
                                                        product={product}
                                                        imageUrl={product.imageUrl}
                                                        priority={isPriority}
                                                        subProducts={shouldShowSubProducts ? subProducts : undefined}
                                                        onAddToCart={handleAddToCart}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                // Mostrar produtos da categoria selecionada
                                <div className="space-y-3">
                                    {filteredProducts.map((product, index) => {
                                        const shouldShowSubProducts = isMassasProductAction(product);
                                        const isPriority = index < 2 && !!product.imageUrl;
                                        return (
                                            <ProductCard
                                                key={product.id}
                                                product={product}
                                                imageUrl={product.imageUrl}
                                                priority={isPriority}
                                                subProducts={shouldShowSubProducts ? subProducts : undefined}
                                                onAddToCart={handleAddToCart}
                                            />
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
