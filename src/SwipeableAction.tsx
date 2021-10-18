import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

export interface SwipeableActionProps extends ViewProps {
  children: React.ReactNode;
}

export function SwipeableAction({
  style,
  children,
  ...props
}: SwipeableActionProps) {
  return (
    <View style={[styles.base, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
