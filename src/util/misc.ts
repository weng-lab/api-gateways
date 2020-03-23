
export interface Service {
    name: string;
    url: string;
}

export function appendUrl(base: string, path: string): string {
    if (base.endsWith("/")) return `${base}${path}`;
    else return `${base}/${path}`;
}