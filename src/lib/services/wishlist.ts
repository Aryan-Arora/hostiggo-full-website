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

export const wishlistAPI = {
  async addToWishlist(item: AddWishlistPayload): Promise<WishlistDTO> {
    // category_id is NOT NULL on wishlists — a heart-icon click anywhere in
    // the app (search cards, property page) doesn't have a category in
    // context, so fall back to a "Saved" category, creating it the first
    // time this user ever saves something.
    let categoryId = item.category_id;
    if (!categoryId) {
      const { data: existing } = await supabase
        .from("categories")
        .select("id")
        .eq("user_id", item.user_id)
        .eq("name", "Saved")
        .maybeSingle();
      if (existing) {
        categoryId = existing.id;
      } else {
        const { data: created, error: createErr } = await supabase
          .from("categories")
          .insert([{ user_id: item.user_id, name: "Saved" }])
          .select("id")
          .single();
        if (createErr) throw createErr;
        categoryId = created.id;
      }
    }

    const { data, error } = await supabase
      .from("wishlists")
      .insert([{ ...item, category_id: categoryId }])
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

  async deleteWishlistCategory(categoryId: string): Promise<void> {
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
  ): Promise<WishlistCategoryDTO> {
    const { data, error } = await supabase
      .from("categories")
      .update({ name: newName })
      .eq("id", categoryId)
      .select()
      .single();

    if (error) throw error;
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
