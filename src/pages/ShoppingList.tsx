import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShoppingItem {
  id: string;
  item_name: string;
  quantity: number;
  unit: string;
  is_checked: boolean;
  recipe_id?: string;
}

const ShoppingList = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState({ name: "", quantity: "1", unit: "" });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("shopping_list")
      .select("*")
      .order("is_checked", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Chyba",
        description: "Nepodarilo sa načítať nákupný zoznam.",
        variant: "destructive",
      });
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  const addItem = async () => {
    if (!newItem.name) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("shopping_list").insert({
      user_id: user.id,
      item_name: newItem.name,
      quantity: parseFloat(newItem.quantity) || 1,
      unit: newItem.unit,
      is_checked: false,
    });

    if (error) {
      toast({
        title: "Chyba",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setNewItem({ name: "", quantity: "1", unit: "" });
      fetchItems();
    }
  };

  const toggleItem = async (id: string, is_checked: boolean) => {
    const { error } = await supabase
      .from("shopping_list")
      .update({ is_checked })
      .eq("id", id);

    if (error) {
      toast({
        title: "Chyba",
        description: error.message,
        variant: "destructive",
      });
    } else {
      fetchItems();
    }
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from("shopping_list").delete().eq("id", id);

    if (error) {
      toast({
        title: "Chyba",
        description: error.message,
        variant: "destructive",
      });
    } else {
      fetchItems();
    }
  };

  const clearChecked = async () => {
    const checkedIds = items.filter(i => i.is_checked).map(i => i.id);
    const { error } = await supabase.from("shopping_list").delete().in("id", checkedIds);

    if (error) {
      toast({
        title: "Chyba",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Vymazané",
        description: "Nakúpené položky boli odstránené.",
      });
      fetchItems();
    }
  };

  const exportList = () => {
    const text = items
      .filter(i => !i.is_checked)
      .map(i => {
        const quantityText = i.quantity !== 1 || i.unit 
          ? `${i.quantity !== 1 ? i.quantity : ''} ${i.unit}`.trim()
          : '';
        return quantityText ? `${i.item_name} - ${quantityText}` : i.item_name;
      })
      .join("\n");
    
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nakupny-zoznam.txt";
    a.click();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Nákupný zoznam</h1>
          <p className="text-muted-foreground">Spravujte položky na nákup</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportList} disabled={items.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            onClick={clearChecked}
            disabled={!items.some(i => i.is_checked)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Vymazať nakúpené
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pridať položku</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Názov položky"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              onKeyPress={(e) => e.key === "Enter" && addItem()}
              className="flex-1"
            />
            <Input
              placeholder="Množstvo"
              type="number"
              value={newItem.quantity}
              onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
              className="w-24"
            />
            <Input
              placeholder="Jednotka"
              value={newItem.unit}
              onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
              className="w-24"
            />
            <Button onClick={addItem}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Načítavam zoznam...</p>
        </div>
      ) : items.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground">Váš nákupný zoznam je prázdny</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <Checkbox
                  checked={item.is_checked}
                  onCheckedChange={(checked) => toggleItem(item.id, !!checked)}
                />
                <div className={`flex-1 ${item.is_checked ? "line-through text-muted-foreground" : ""}`}>
                  <span className="font-medium">{item.item_name}</span>
                  {(item.quantity !== 1 || item.unit) && (
                    <span className="text-muted-foreground ml-2">
                      {item.quantity !== 1 && item.quantity} {item.unit}
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteItem(item.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShoppingList;