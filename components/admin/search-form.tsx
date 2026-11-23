import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function SearchForm({
  placeholder,
  defaultValue = "",
}: {
  placeholder: string;
  defaultValue?: string;
}) {
  return (
    <form method="get" className="flex flex-wrap gap-2" role="search">
      <Input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        aria-label={placeholder}
        className="max-w-xs"
      />
      <Button type="submit" variant="outline">
        Rechercher
      </Button>
    </form>
  );
}
