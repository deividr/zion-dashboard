"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Product } from "@/domains/product";
import { formatCurrency } from "@/lib/utils";
import { Minus, Plus, ImageIcon } from "lucide-react";
import Image from "next/image";
import * as React from "react";

interface SubProduct {
    id: string;
    name: string;
}

interface ProductCardProps {
    product: Product;
    imageUrl?: string;
    subProducts?: SubProduct[];
    priority?: boolean;
    onQuantityChange?: (productId: string, quantity: number) => void;
    onSubProductChange?: (productId: string, subProductId: string, isChecked: boolean) => void;
    onAddToCart?: (product: Product, quantity: number, selectedSubProducts: string[]) => void;
}

const PRESET_QUANTITIES = [0.25, 0.5, 1.0, 1.5, 2.0];
const INITIAL_QUANTITY = 1.0;

export function ProductCard({
    product,
    imageUrl,
    subProducts,
    priority = false,
    onQuantityChange,
    onSubProductChange,
    onAddToCart,
}: ProductCardProps) {
    const [quantity, setQuantity] = React.useState<number>(INITIAL_QUANTITY);
    const [selectedSubProducts, setSelectedSubProducts] = React.useState<Set<string>>(new Set());
    const [accordionValue, setAccordionValue] = React.useState<string>("");

    // Resetar quando o produto mudar
    React.useEffect(() => {
        setQuantity(INITIAL_QUANTITY);
        setSelectedSubProducts(new Set());
        setAccordionValue("");
    }, [product.id]);

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
        <Card className="w-full overflow-hidden">
            <div className="flex gap-4 p-4">
                {/* Conteúdo à esquerda */}
                <div className="flex-1 flex gap-3 min-w-0">
                    {/* Imagem à esquerda */}
                    <div className="relative h-24 w-24 flex-shrink-0">
                        {imageUrl && imageUrl.trim() !== "" ? (
                            <Image
                                src={imageUrl}
                                alt={product.name}
                                fill
                                priority={priority}
                                sizes="96px"
                                className="rounded-lg object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center rounded-lg bg-muted">
                                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                            </div>
                        )}
                    </div>
                    {/* Nome e Preço */}
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                            <CardTitle className="text-base font-semibold truncate">{product.name}</CardTitle>
                            <span className="text-lg font-bold text-primary">
                                {formatCurrency(product.value * quantity)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Conteúdo à direita */}
                <div className="flex-1 flex flex-col gap-3 min-w-0">
                    {/* Controles de Quantidade */}
                    <div className="flex flex-col items-end gap-4">
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleQuantityChange(product.unityType === "UN" ? -1 : -0.25)}
                                disabled={quantity <= 1.0}
                            >
                                <Minus className="h-4 w-4" />
                            </Button>
                            <span className="text-sm font-medium whitespace-nowrap min-w-[80px] text-center">
                                {formattedQuantity} {product.unityType.toLowerCase()}
                            </span>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleQuantityChange(product.unityType === "UN" ? 1 : 0.25)}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* ToggleGroup para KG/LT */}
                        {(product.unityType === "KG" || product.unityType === "LT") && (
                            <ToggleGroup
                                type="single"
                                variant="outline"
                                className="ml-auto"
                                value={quantity.toString()}
                                onValueChange={handlePresetChange}
                            >
                                {PRESET_QUANTITIES.map((preset) => (
                                    <ToggleGroupItem
                                        key={preset}
                                        value={preset.toString()}
                                        className="px-2 text-xs h-8"
                                    >
                                        {preset.toFixed(3)}
                                    </ToggleGroupItem>
                                ))}
                            </ToggleGroup>
                        )}
                    </div>

                    {/* Adicionais */}
                    {subProducts && subProducts.length > 0 && (
                        <Accordion
                            type="single"
                            collapsible
                            className="w-full"
                            value={accordionValue}
                            onValueChange={setAccordionValue}
                        >
                            <AccordionItem value="sub-products" className="border-b-0">
                                <AccordionTrigger className="py-1 text-sm font-medium text-primary hover:no-underline">
                                    Adicionais
                                </AccordionTrigger>
                                <AccordionContent className="pb-0">
                                    <div className="grid gap-2">
                                        {subProducts.map((sub) => (
                                            <div key={sub.id} className="flex items-center gap-2">
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
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    )}

                    {/* Botão Adicionar */}
                    <Button
                        type="button"
                        className="w-full mt-auto"
                        onClick={() => {
                            // Adicionar ao carrinho
                            onAddToCart?.(product, quantity, Array.from(selectedSubProducts));

                            // Resetar configurações para o estado original
                            setQuantity(INITIAL_QUANTITY);
                            setSelectedSubProducts(new Set());
                            setAccordionValue("");
                        }}
                        disabled={quantity < 0.25}
                    >
                        Adicionar ao Carrinho
                    </Button>
                </div>
            </div>
        </Card>
    );
}
