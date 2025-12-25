"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Product } from "@/domains/product";
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

const PRESET_QUANTITIES = [0.25, 0.5, 1.0, 1.5, 2.0];

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
        if (product.unityType === "UN") {
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

    const handlePresetChange = (value: string) => {
        if (value) {
            const newQuantity = parseFloat(value);
            setQuantity(newQuantity);
            onQuantityChange?.(product.id || "", newQuantity);
        }
    };

    const formattedQuantity = product.unityType === "UN" ? quantity : quantity.toFixed(3);

    return (
        <Card className="w-full max-w-xs overflow-hidden">
            <CardHeader className="p-0">
                <div className="relative h-40 w-full">
                    <Image src={imageUrl} alt={product.name} layout="fill" objectFit="cover" className="rounded-t-lg" />
                </div>
                <div className="p-4">
                    <CardTitle className="text-lg font-semibold">{product.name}</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="flex items-center justify-between space-x-2">
                    <span className="text-xl font-bold text-primary">{formatCurrency(product.value * quantity)}</span>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleQuantityChange(product.unityType === "UN" ? -1 : -0.25)}
                            disabled={
                                (product.unityType === "UN" && quantity <= 1) ||
                                ((product.unityType === "KG" || product.unityType === "LT") && quantity <= 0.25)
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
                            onClick={() => handleQuantityChange(product.unityType === "UN" ? 1 : 0.25)}
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {(product.unityType === "KG" || product.unityType === "LT") && (
                    <ToggleGroup
                        type="single"
                        variant="outline"
                        className="w-full justify-between mt-4"
                        value={quantity.toString()}
                        onValueChange={handlePresetChange}
                    >
                        {PRESET_QUANTITIES.map((preset) => (
                            <ToggleGroupItem key={preset} value={preset.toString()} className="px-2 text-xs h-8">
                                {preset.toFixed(3)}
                            </ToggleGroupItem>
                        ))}
                    </ToggleGroup>
                )}

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
