"use client";

import { CardHeaderWithIcon } from "@/components/card-header-with-icon";
import {
    Button,
    Card,
    CardContent,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    Input,
    Popover,
    PopoverContent,
    PopoverTrigger,
    Textarea,
} from "@/components/ui";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, MapPin, Package } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { OrderFormData } from ".";

interface OrderDetailsSectionProps {
    form: UseFormReturn<OrderFormData>;
}

export function OrderDetailsSection({ form }: OrderDetailsSectionProps) {
    return (
        <Card>
            <CardHeaderWithIcon icon={Package} title="Detalhes do Pedido" />
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="pickupDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Data de Retirada *
                                </FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-full pl-3 text-left font-normal",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value ? (
                                                    format(field.value, "dd 'de' MMMM 'de' yyyy", {
                                                        locale: ptBR,
                                                    })
                                                ) : (
                                                    <span>Selecione uma data</span>
                                                )}
                                                <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <CalendarComponent
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) => date < new Date()}
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="orderLocal"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    Local/Geladeira *
                                </FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="Ex: Geladeira 1, Balcão..." />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="observations"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Observações</FormLabel>
                            <FormControl>
                                <Textarea
                                    {...field}
                                    placeholder="Adicione observações sobre o pedido..."
                                    className="min-h-[100px]"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>
    );
}
