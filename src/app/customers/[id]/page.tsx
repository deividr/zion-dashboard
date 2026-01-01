"use client";

import { CardHeaderWithIcon } from "@/components/card-header-with-icon";
import { Card, CardContent } from "@/components/ui";
import { Address, Customer } from "@/domains";
import { useFetchClient } from "@/lib/fetch-client";
import { useHeaderStore } from "@/stores/header-store";
import { MapPin } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AddressSection } from "./address-section";
import { CustomerForm } from "./customer-form";

export default function CustomerEdit() {
    const { fetch } = useFetchClient();
    const { id } = useParams();
    const searchParams = useSearchParams();
    const phoneFromQuery = searchParams.get("phone") || "";
    const returnToOrder = searchParams.get("returnToOrder") === "true";
    const [customer, setCustomer] = useState<Customer | null>({
        id: "",
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

        if (id && id !== "new" && id !== "") {
            fetchCustomer();
        }
    }, [id, fetch]);

    if (!customer) return <div>Loading...</div>;

    return (
        <CustomerForm customer={customer} returnToOrder={returnToOrder} phoneFromQuery={phoneFromQuery}>
            <Card>
                <CardHeaderWithIcon icon={MapPin} title="Endereços do Cliente" />
                <CardContent>
                    <AddressSection initialAddresses={addresses} customer={customer} />
                </CardContent>
            </Card>
        </CustomerForm>
    );
}
