"use client";

import { Button } from "@/components/ui/button";
import { Address } from "@/domains";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { AddressForm } from "./address-form";

interface AddressSectionProps {
  initialAddresses: Address[];
}

export function AddressSection({ initialAddresses }: AddressSectionProps) {
  const { toast } = useToast();
  const [showAddressForm, setShowAddressForm] = useState<boolean>(false);
  const [editingAddressIndex, setEditingAddressIndex] = useState<number | null>(
    null
  );
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [currentAddress, setCurrentAddress] = useState<Address | undefined>();

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

  const handleDeleteAddress = (index: number) => {
    const newAddresses = [...addresses];
    newAddresses.splice(index, 1);
    setAddresses(newAddresses);
  };

  const onSubmitAddress = async (data: Address) => {
    const updatedAddresses = [...addresses];

    if (editingAddressIndex !== null) {
      updatedAddresses[editingAddressIndex] = data;
    } else {
      updatedAddresses.push(data);
    }

    if (data.isDefault) {
      updatedAddresses.forEach((addr, index) => {
        if (index !== editingAddressIndex) {
          addr.isDefault = false;
        }
      });
    }

    setAddresses(updatedAddresses);
    setShowAddressForm(false);
    setEditingAddressIndex(null);
    setCurrentAddress(undefined);

    toast({
      variant: "success",
      description: `Endereço ${
        editingAddressIndex ? "atualizado" : "adicionado"
      } com sucesso!`,
    });
  };

  return (
    <>
      {/* Seção de Endereços */}
      <div className="grid gap-5 mt-20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Endereços</h2>
          <Button type="button" onClick={handleAddAddress}>
            Adicionar Endereço
          </Button>
        </div>

        {/* Lista de Endereços */}
        <div className="space-y-4 mb-6">
          {!addresses?.length ? (
            <div className="text-center py-8 border border-dashed rounded-md text-muted-foreground">
              Nenhum endereço cadastrado
            </div>
          ) : (
            addresses?.map((address, index) => (
              <div
                key={address.id || index}
                className="p-4 border rounded-md shadow-sm hover:shadow-md transition-all bg-card"
              >
                <div className="flex justify-between items-center">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">
                        {address.street}, {address.number}
                      </h3>
                      {address.isDefault && (
                        <span className="bg-primary/20 text-primary text-xs px-2 py-1 rounded-full">
                          Principal
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {address.neighborhood}, {address.city} - {address.state}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      CEP: {address.cep.replace(/(\d{5})(\d{3})/, "$1-$2")}
                      {address.aditionalDetails &&
                        ` - ${address.aditionalDetails}`}
                    </p>
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
            ))
          )}
        </div>
      </div>

      <AddressForm
        isOpen={showAddressForm}
        onOpenChange={setShowAddressForm}
        onSubmit={onSubmitAddress}
        address={currentAddress}
        isEditing={editingAddressIndex !== null}
      />
    </>
  );
}
