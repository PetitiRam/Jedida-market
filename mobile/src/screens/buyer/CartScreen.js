import { useCallback, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenContainer, EmptyState, PrimaryButton } from '../../components/UI';
import * as commerceApi from '../../api/commerceApi';
import { colors } from '../../theme';

export default function CartScreen({ navigation }) {
  const [cart, setCart] = useState(null);

  const load = useCallback(async () => {
    const { data } = await commerceApi.getCart();
    setCart(data);
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const changeQty = async (itemId, qty) => { await commerceApi.updateCartItem(itemId, qty); load(); };
  const remove = async (itemId) => { await commerceApi.removeCartItem(itemId); load(); };

  const checkout = async () => {
    const { data } = await commerceApi.checkoutCart({ method: 'flutterwave' });
    if (data.checkoutUrl) {
      // opens the provider's hosted checkout; on return, confirm below
    }
    await commerceApi.confirmCartPayment(data.checkoutGroupId);
    navigation.navigate('Orders');
  };

  if (!cart) return <ScreenContainer><EmptyState text="Loading cart…" /></ScreenContainer>;

  return (
    <ScreenContainer scroll={false}>
      <Text style={{ fontSize: 20, fontWeight: '800', padding: 16, paddingBottom: 0 }}>Your Cart</Text>
      <FlatList
        data={cart.items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<EmptyState text="Your cart is empty." />}
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row', backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 12, marginBottom: 10, gap: 
12, alignItems: 'center' }}>
            <View style={{ width: 56, height: 56, borderRadius: 8, backgroundColor: colors.creamDim }}>
              {item.images?.[0] && <Image source={{ uri: item.images[0] }} style={{ width: 56, height: 56, borderRadius: 8 }} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700' }} numberOfLines={1}>{item.title}</Text>
              <Text style={{ color: colors.forest, fontWeight: '800' }}>{item.currency} {Number(item.price).toLocaleString()}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity onPress={() => changeQty(item.id, item.quantity - 1)}><Text style={{ fontSize: 18, paddingHorizontal: 6 }}>−</Text></TouchableOpacity>
              <Text>{item.quantity}</Text>
              <TouchableOpacity onPress={() => changeQty(item.id, item.quantity + 1)}><Text style={{ fontSize: 18, paddingHorizontal: 6 }}>+</Text></TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => remove(item.id)}><Text style={{ color: '#C1622D' }}>Remove</Text></TouchableOpacity>
          </View>
        )}
        ListFooterComponent={cart.items.length > 0 && (
          <View style={{ marginTop: 10 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', marginBottom: 10 }}>Total: {cart.items[0]?.currency} {cart.total.toLocaleString()}</Text>
            <PrimaryButton title="Checkout all items" onPress={checkout} />
          </View>
        )}
      />
    </ScreenContainer>
  );
}
