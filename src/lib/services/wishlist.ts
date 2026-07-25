import { supabase } from "../supabase";

export type WishlistDTO = {
  id: string;
  user_id: string;
  listing_id: string;
  category_id?: string;
};

export type WishlistCategoryDTO = {
  id: string;
  user_id: string;
  name: string;
};

export type AddWishlistPayload = {
  user_id: string;
  listing_id: string;
  category_id?: string;
};

export type AddWishlistCategoryPayload = {
  user_id: string;
  name: string;
};

const DEFAULT_CATEGORY_NAME = "Saved";

export const wishlistAPI = {
  async addToWishlist(item: AddWishlistPayload): Promise<WishlistDTO> {
    const { user_id, listing_id, category_id } = item;

    const { data: alreadySaved, error: dupeErr } = await supabase
      .from("wishlists")
      .select("*")
      .eq("user_id", user_id)
      .eq("listing_id", listing_id)
      .limit(1);

    if (dupeErr) throw dupeErr;
    if (alreadySaved && alreadySaved.length > 0) {
      return alreadySaved[0];
    }

    let categoryId = category_id;

    if (!categoryId) {
      const { data: existing, error: findErr } = await supabase
        .from("categories")
        .select("id")
        .eq("user_id", user_id)
        .eq("name", DEFAULT_CATEGORY_NAME)
        .limit(1);

      if (findErr) throw findErr;

      if (existing && existing.length > 0) {
        categoryId = existing[0].id;
      } else {
        const { data: created, error: createErr } = await supabase
          .from("categories")
          .insert([{ user_id, name: DEFAULT_CATEGORY_NAME }])
          .select("id")
          .single();

        if (createErr) throw createErr;
        categoryId = created.id;
      }
    }

    const { data, error } = await supabase
      .from("wishlists")
      .insert([{ user_id, listing_id, category_id: categoryId }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async addWishlistCategories(
    item: AddWishlistCategoryPayload,
  ): Promise<WishlistCategoryDTO> {
    const { data, error } = await supabase
      .from("categories")
      .insert([item])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteWishlistCategory(categoryId: string, userId: string): Promise<void> {
    // Ownership check -- without it, any client could delete any user's
    // category (and all its saved items) just by guessing a category id.
    const { data: category, error: ownerError } = await supabase
      .from("categories")
      .select("id")
      .eq("id", categoryId)
      .eq("user_id", userId)
      .maybeSingle();
    if (ownerError) throw ownerError;
    if (!category) throw new Error("Category not found");

    const { error: itemsError } = await supabase
      .from("wishlists")
      .delete()
      .eq("category_id", categoryId);

    if (itemsError) {
      console.warn("Error deleting category items:", itemsError);
      throw itemsError;
    }

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", categoryId);

    if (error) throw error;
  },

  async renameWishlistCategory(
    categoryId: string,
    newName: string,
    userId: string,
  ): Promise<WishlistCategoryDTO> {
    // Scoped by user_id so a client can only rename its own categories.
    const { data, error } = await supabase
      .from("categories")
      .update({ name: newName })
      .eq("id", categoryId)
      .eq("user_id", userId)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Category not found");
    return data;
  },

  async getWishlistCategories(userId: string): Promise<WishlistCategoryDTO[]> {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;
    return data || [];
  },

  async removeFromWishlist(
    userId: string,
    listingId: string,
    categoryId?: string,
  ): Promise<void> {
    let query = supabase.from("wishlists").delete().eq("user_id", userId).eq("listing_id", listingId);

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    const { error } = await query;
    if (error) throw error;
  },

  async getWishlist(userId: string): Promise<WishlistDTO[]> {
    const { data, error } = await supabase
      .from("wishlists")
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;
    return data || [];
  },

  async getWishlistListingIds(userId: string): Promise<{ listing_id: string }[]> {
    const { data, error } = await supabase
      .from("wishlists")
      .select("listing_id")
      .eq("user_id", userId);

    if (error) throw error;
    return data || [];
  },

  async fetchCategoricalWishlistListing(userId: string, categoryId?: string) {
    let query = supabase
      .from("wishlists")
      .select(
        `
        user_id,
        category_id,
        listing:listing_search_view!inner(
          listing_id,
          title,
          price_weekday,
          avg_rating,
          review_count,
          district,
          state,
          is_active,
          listing_media!inner(media_url)
        )
      `,
      )
      .eq("user_id", userId)
      .eq("listing.is_active", true)
      .eq("listing.listing_media.is_cover", true);

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },
};
