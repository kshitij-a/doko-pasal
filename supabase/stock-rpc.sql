-- Phase 1 FIX-08: atomic stock decrement. Run once in Supabase Dashboard > SQL Editor.
-- Single UPDATE ... WHERE stock >= qty; returns false when insufficient (caller logs, best-effort).
-- NULL stock means unlimited: returns true without decrementing.

create or replace function decrement_stock(p_product uuid, p_qty int)
returns boolean
language plpgsql
security definer
as $$
begin
  if exists (select 1 from products where id = p_product and stock is null) then
    return true;
  end if;
  update products set stock = stock - p_qty where id = p_product and stock >= p_qty;
  if found then return true; else return false; end if;
end;
$$;
