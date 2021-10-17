import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Item = {
  title: string;
  description?: string;
};

export function List() {
  const insets = useSafeAreaInsets();

  const [data] = useState(INITIAL_DATA);

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.title}
      renderItem={ListItem}
      ListHeaderComponent={ListHeader}
      ListHeaderComponentStyle={data.length && styles.listTitleSpacing}
      ItemSeparatorComponent={ListDivider}
      style={styles.list}
      contentContainerStyle={{
        paddingTop: 16 + insets.top,
        paddingBottom: 16 + insets.bottom,
      }}
    />
  );
}

function ListHeader() {
  return <Text style={styles.listTitle}>To-dos</Text>;
}

function ListItem({ item }: { item: Item }) {
  return (
    <View style={styles.item}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemDate}>just now</Text>
      </View>
      {item.description && (
        <Text style={styles.itemDescription}>{item.description}</Text>
      )}
      <View style={styles.itemActions}>
        <ListItemAction>Share</ListItemAction>
      </View>
    </View>
  );
}

function ListItemAction({ children }: { children: React.ReactNode }) {
  return (
    <Pressable style={styles.itemAction}>
      {({ pressed }) => (
        <Text
          style={[
            styles.itemActionLabel,
            pressed && styles.itemActionLabelPressed,
          ]}
        >
          {children}
        </Text>
      )}
    </Pressable>
  );
}

function ListDivider() {
  return <View style={styles.listDivider} />;
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: 'white',
  },
  listDivider: {
    height: 1,
    backgroundColor: 'rgba(48, 55, 66, 0.1)',
  },
  listTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#303742',
    padding: 16,
  },
  listTitleSpacing: {
    marginBottom: 16,
  },
  item: {
    padding: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#303742',
  },
  itemDate: {
    fontSize: 12,
    color: '#A6AEBA',
  },
  itemDescription: {
    fontSize: 12,
    color: '#767F8D',
    marginTop: 4,
  },
  itemActions: {
    margin: -4,
    marginTop: 16 - 4,
    flexDirection: 'row',
  },
  itemAction: {
    margin: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  itemActionLabel: {
    color: '#6200EE',
    marginHorizontal: 14,
    marginVertical: 10,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 1.25,
    textTransform: 'uppercase',
  },
  itemActionLabelPressed: {
    opacity: 0.25,
  },
});

const INITIAL_DATA: Item[] = [
  {
    title: 'Build an open-source library',
    description: 'Time to give back to the community!',
  },
  {
    title: 'Get life together',
    description: "Reminder: it's okay to cry during therapy.",
  },
  {
    title: 'Love my friends',
    description: 'Remember the good times and cherish the present!',
  },
  {
    title: 'Buy grande iced caramel macchiato',
    description: "Saving's overrated, anyway.",
  },
];
