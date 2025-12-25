"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Product, UnityType } from "@/domains/product"; // Importando Product e UnityType
import { formatCurrency } from "@/lib/utils";
import { Minus, Plus } from "lucide-react";
import Image from "next/image";
import * as React from "react";

interface SubProduct {
    id: string;
    name: string;
}

interface ProductCardProps {
    product: Product;
    imageUrl: string;
    subProducts?: SubProduct[];
    onQuantityChange?: (productId: string, quantity: number) => void;
    onSubProductChange?: (productId: string, subProductId: string, isChecked: boolean) => void;
    onAddToCart?: (product: Product, quantity: number, selectedSubProducts: string[]) => void;
}
export function ProductCard({
    product,
    imageUrl,
    subProducts,
    onQuantityChange,
    onSubProductChange,
    onAddToCart,
}: ProductCardProps) {
    const [quantity, setQuantity] = React.useState<number>(1.0);
    const [selectedSubProducts, setSelectedSubProducts] = React.useState<Set<string>>(new Set());

    const handleQuantityChange = (amount: number) => {
        let newQuantity = quantity;
        if (product.unityType === UnityType.UN) {
            newQuantity = Math.max(1, quantity + amount);
        } else {
            newQuantity = Math.max(0.25, parseFloat((quantity + amount).toFixed(3)));
        }
        setQuantity(newQuantity);
        onQuantityChange?.(product.id || "", newQuantity);
    };

    const handleSubProductToggle = (subProductId: string, isChecked: boolean) => {
        const newSelected = new Set(selectedSubProducts);
        if (isChecked) {
            newSelected.add(subProductId);
        } else {
            newSelected.delete(subProductId);
        }
        setSelectedSubProducts(newSelected);
        onSubProductChange?.(product.id || "", subProductId, isChecked);
    };

    const formattedQuantity = product.unityType === UnityType.UN ? quantity : quantity.toFixed(3);

    return (
        <Card className="w-full max-w-xs overflow-hidden">
            <CardHeader className="p-0">
                <div className="relative h-40 w-full">
                    <Image src={imageUrl} alt={product.name} layout="fill" objectFit="cover" className="rounded-t-lg" />
                </div>
                <div className="p-4">
                    <CardTitle className="text-lg font-semibold">{product.name}</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                        {product.unityType === UnityType.UN
                            ? "Unidade(s)"
                            : product.unityType === UnityType.KG
                              ? "Quilograma(s)"
                              : "Litro(s)"}
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="flex items-center justify-between space-x-2">
                    <span className="text-xl font-bold text-primary">{formatCurrency(product.value * quantity)}</span>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleQuantityChange(product.unityType === UnityType.UN ? -1 : -0.25)}
                            disabled={
                                (product.unityType === UnityType.UN && quantity <= 1) ||
                                ((product.unityType === UnityType.KG || product.unityType === UnityType.LT) &&
                                    quantity <= 0.25)
                            }
                        >
                            <Minus className="h-4 w-4" />
                        </Button>
                        <span className="text-center text-base font-medium whitespace-nowrap">
                            {formattedQuantity} {product.unityType.toLowerCase()}
                        </span>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleQuantityChange(product.unityType === UnityType.UN ? 1 : 0.25)}
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {subProducts && subProducts.length > 0 && (
                    <Accordion type="single" collapsible className="w-full mt-4">
                        <AccordionItem value="sub-products" className="border-b-0">
                            <AccordionTrigger className="py-2 text-base font-medium text-primary hover:no-underline">
                                Adicionais
                            </AccordionTrigger>
                            <AccordionContent className="pb-0">
                                <div className="grid gap-2">
                                    {subProducts.map((sub) => (
                                        <div key={sub.id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    id={`sub-${sub.id}`}
                                                    checked={selectedSubProducts.has(sub.id)}
                                                    onCheckedChange={(checked) =>
                                                        handleSubProductToggle(sub.id, !!checked)
                                                    }
                                                />
                                                <Label htmlFor={`sub-${sub.id}`} className="text-sm font-normal">
                                                    {sub.name}
                                                </Label>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                )}
            </CardContent>
            <CardFooter className="p-4 pt-0">
                <Button
                    className="w-full"
                    onClick={() => onAddToCart?.(product, quantity, Array.from(selectedSubProducts))}
                    disabled={quantity < 0.25}
                >
                    Adicionar ao Carrinho
                </Button>
            </CardFooter>
        </Card>
    );
}
