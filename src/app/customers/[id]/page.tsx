"use client";

import { Address, Customer } from "@/domains";
import { useHeaderStore } from "@/stores/header-store";
import { useFetchClient } from "@/lib/fetch-client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CustomerForm } from "./customer-form";
import { AddressSection } from "./address-section";
import { Card, CardContent } from "@/components/ui";
import { MapPin } from "lucide-react";
import { CardHeaderWithIcon } from "@/components/card-header-with-icon";

export default function CustomerEdit() {
    const { fetch } = useFetchClient();
    const { id } = useParams();
    const [customer, setCustomer] = useState<Customer | null>({
        id: "new",
        name: "",
        email: "",
        phone: "",
        phone2: "",
    });
    const [addresses, setAddresses] = useState<Address[]>([]);
    const setTitle = useHeaderStore((state) => state.setTitle);

    useEffect(() => {
        setTitle(["Clientes", customer?.name ? `${customer.name}` : "Novo Cliente"]);
    }, [setTitle, customer]);

    useEffect(() => {
        const fetchCustomer = async () => {
            const result = await fetch<{
                customer: Customer;
                addresses: Address[];
            }>(`${process.env.NEXT_PUBLIC_HOST_API}/customers/${id}`);
            setCustomer(result?.customer ?? null);
            setAddresses(result?.addresses ?? []);
        };

        if (id && id !== "new") {
            fetchCustomer();
        }
    }, [id, fetch]);

    if (!customer) return <div>Loading...</div>;

    return (
        <CustomerForm customer={customer}>
            <Card>
                <CardHeaderWithIcon icon={MapPin} title="Endereços do Cliente" />
                <CardContent>
                    <AddressSection initialAddresses={addresses} customer={customer} />
                </CardContent>
            </Card>
        </CustomerForm>
    );
}
