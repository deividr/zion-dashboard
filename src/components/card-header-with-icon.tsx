import { CardHeader, CardTitle } from "@/components/ui";
import { LucideIcon } from "lucide-react";

interface CardHeaderWithIconProps {
    icon: LucideIcon;
    title: string;
}

export function CardHeaderWithIcon({ icon: Icon, title }: CardHeaderWithIconProps) {
    return (
        <CardHeader>
            <CardTitle className="flex items-center gap-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary">
                    <Icon className="h-5 w-5 text-primary-foreground" />
                </div>
                {title}
            </CardTitle>
        </CardHeader>
    );
}
