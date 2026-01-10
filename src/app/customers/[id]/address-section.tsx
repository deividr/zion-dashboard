"use client";

import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Address, Customer } from "@/domains";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Pencil, Trash2, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { AddressForm } from "./address-form";
import { useFetchClient } from "@/lib/fetch-client";

interface AddressSectionProps {
    initialAddresses: Address[];
    customer: Customer;
}

export function AddressSection({ initialAddresses, customer }: AddressSectionProps) {
    const { toast } = useToast();
    const { fetch } = useFetchClient();
    const [showAddressForm, setShowAddressForm] = useState<boolean>(false);
    const [editingAddressIndex, setEditingAddressIndex] = useState<number | null>(null);
    const [addresses, setAddresses] = useState<Address[]>(initialAddresses ?? []);
    const [currentAddress, setCurrentAddress] = useState<Address | undefined>();
    const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
    const [addressToDelete, setAddressToDelete] = useState<number | null>(null);

    useEffect(() => {
        setAddresses(initialAddresses ?? []);
    }, [initialAddresses]);

    // Escuta o evento personalizado para adicionar endereço
    useEffect(() => {
        const handleAddAddress = () => {
            setEditingAddressIndex(null);
            setCurrentAddress(undefined);
            setShowAddressForm(true);
        };

        window.addEventListener("addAddress", handleAddAddress);
        return () => window.removeEventListener("addAddress", handleAddAddress);
    }, []);

    const handleAddAddress = () => {
        setEditingAddressIndex(null);
        setCurrentAddress(undefined);
        setShowAddressForm(true);
    };

    const handleEditAddress = (address: Address, index: number) => {
        setCurrentAddress(address);
        setEditingAddressIndex(index);
        setShowAddressForm(true);
    };

    const handleDeleteAddress = async (index: number) => {
        setAddressToDelete(index);
        setShowDeleteDialog(true);
    };

    const confirmDeleteAddress = async () => {
        if (addressToDelete === null) return;

        let newAddresses = [...addresses];
        newAddresses.splice(addressToDelete, 1);

        if (addresses[addressToDelete].id) {
            await fetch(
                `${process.env.NEXT_PUBLIC_HOST_API}/customers/${customer.id}/addresses/${addresses[addressToDelete].id}`,
                {
                    method: "DELETE",
                }
            );

            const result = await fetch<{ addresses: Address[] }>(
                `${process.env.NEXT_PUBLIC_HOST_API}/customers/${customer.id}`
            );
            newAddresses = result?.addresses ?? [];

            toast({
                variant: "success",
                description: `Endereço excluído com sucesso!`,
            });
        }

        setAddresses(newAddresses);
        setShowDeleteDialog(false);
        setAddressToDelete(null);
    };

    const onSubmitAddress = async (data: Address) => {
        const updatedAddresses = [...addresses];

        if (data.isDefault) {
            updatedAddresses.forEach((addr, index) => {
                if (index !== editingAddressIndex) {
                    addr.isDefault = false;
                }
            });
        }

        if (editingAddressIndex !== null) {
            updatedAddresses[editingAddressIndex] = data;
        } else {
            updatedAddresses.push(data);
        }

        setAddresses(updatedAddresses);
        setShowAddressForm(false);
        setEditingAddressIndex(null);
        setCurrentAddress(undefined);
    };

    return (
        <div className="space-y-4">
            {/* Lista de Endereços */}
            {!addresses?.length ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum endereço cadastrado</h3>
                    <p className="text-muted-foreground mb-4">Adicione o primeiro endereço para este cliente.</p>
                    <Button onClick={handleAddAddress} variant="outline">
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar Primeiro Endereço
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    {addresses?.map((address, index) => (
                        <div
                            key={address.id || index}
                            className="p-4 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex items-start gap-3 flex-1">
                                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                                    <div className="space-y-2 flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold">
                                                {address.street}, {address.number}
                                            </h3>
                                            {address.isDefault && (
                                                <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium">
                                                    Principal
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-sm text-muted-foreground">
                                            <span className="font-medium">{address.neighborhood}</span>
                                            {" • "}
                                            {address.city} - {address.state}
                                        </p>

                                        <p className="text-sm text-muted-foreground">
                                            CEP: {address.cep.replace(/(\d{5})(\d{3})/, "$1-$2")}
                                        </p>

                                        {address.aditionalDetails && (
                                            <p className="text-sm text-muted-foreground italic">
                                                {address.aditionalDetails}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => handleEditAddress(address, index)}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="text-destructive hover:text-destructive"
                                        onClick={() => handleDeleteAddress(index)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {/* Botão para adicionar mais endereços */}
                    <div className="pt-2">
                        <Button onClick={handleAddAddress} variant="outline" className="w-full">
                            <Plus className="mr-2 h-4 w-4" />
                            Adicionar Outro Endereço
                        </Button>
                    </div>
                </div>
            )}

            <AddressForm
                isOpen={showAddressForm}
                onOpenChangeAction={setShowAddressForm}
                onSubmitAction={onSubmitAddress}
                address={currentAddress}
                isEditing={editingAddressIndex !== null}
                customer={customer}
            />

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Endereço</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir este endereço? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={() => {
                                setShowDeleteDialog(false);
                                setAddressToDelete(null);
                            }}
                        >
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDeleteAddress}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
