"use client";

import { Address, Customer } from "@/domains";
import { useHeaderStore } from "@/stores/header-store";
import { useFetchClient } from "@/lib/fetch-client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CustomerForm } from "../customer-form";
import { AddressSection } from "../address-section";

export default function CustomerEdit() {
    const { fetch } = useFetchClient();
    const { id } = useParams();
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const setTitle = useHeaderStore((state) => state.setTitle);

    useEffect(() => {
        setTitle([
            "Clientes",
            customer ? `Editar ${customer.name}` : "Carregando...",
        ]);
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
            <AddressSection initialAddresses={addresses} customer={customer} />
        </CustomerForm>
    );
}
