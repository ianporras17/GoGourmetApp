import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { Text, useTheme, Card, Divider, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import CustomButton from '../../components/CustomButton';

const ChatbotScreen = ({ navigation }) => {
  const theme = useTheme();
  const [currentView, setCurrentView] = useState('menu'); // 'menu' or 'answer'
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  const faqData = {
    1: {
      question: '¿Cómo hago una reservación?',
      answer: 'Para hacer una reservación:\n\n1. Explora las experiencias disponibles en la pantalla principal\n2. Selecciona la experiencia que te interese\n3. Haz clic en "Reservar"\n4. Completa el formulario con tus datos\n5. Selecciona el método de pago\n6. Confirma tu reservación\n\nRecibirás un código QR que debes presentar en el evento.'
    },
    2: {
      question: '¿Qué métodos de pago están permitidos?',
      answer: 'Actualmente aceptamos dos métodos de pago:\n\n• **Pago en el lugar**: Pagas directamente en el evento\n• **Transferencia bancaria**: Coordinas el pago previo por transferencia\n\nSi eliges transferencia, recibirás los detalles bancarios por correo electrónico para completar el pago.'
    },
    3: {
      question: '¿Puedo cancelar una experiencia?',
      answer: 'Las políticas de cancelación dependen de cada experiencia:\n\n• **Cancelación gratuita**: Hasta 24 horas antes del evento\n• **Cancelación con cargo**: Menos de 24 horas (50% del valor)\n• **Sin reembolso**: El mismo día del evento\n\nPara cancelar, contacta al chef directamente o envía un correo a soporte.'
    },
    4: {
      question: '¿Cómo califico una experiencia pasada?',
      answer: 'Para calificar una experiencia:\n\n1. Ve a "Mis Reservaciones"\n2. Busca la experiencia en la pestaña "Pasadas"\n3. Haz clic en el ícono de estrella\n4. Selecciona tu calificación (1-5 estrellas)\n5. Escribe un comentario\n6. Opcionalmente, agrega fotos\n7. Envía tu calificación\n\nSolo puedes calificar experiencias a las que hayas asistido.'
    },
    5: {
      question: '¿Qué pasa si no me presento al evento?',
      answer: 'Si no te presentas al evento:\n\n• **Sin aviso previo**: Pierdes el 100% del pago\n• **Aviso con menos de 24h**: Pierdes el 50% del pago\n• **Emergencia médica**: Contacta al chef para posibles excepciones\n\nTu reservación se marcará como "No asistió" y esto puede afectar futuras reservaciones.'
    }
  };

  const handleQuestionSelect = (questionId) => {
    setSelectedQuestion(questionId);
    setCurrentView('answer');
  };

  const handleBackToMenu = () => {
    setCurrentView('menu');
    setSelectedQuestion(null);
  };

  const renderMenu = () => (
    <>
      <View style={styles.botMessageContainer}>
        <View style={styles.botAvatar}>
          <MaterialCommunityIcons name="robot" size={24} color="white" />
        </View>
        <View style={styles.botMessage}>
          <Text style={styles.botText}>Hola 👋 ¿En qué puedo ayudarte?</Text>
        </View>
      </View>

      <Text style={styles.menuTitle}>Preguntas Frecuentes</Text>
      
      {Object.entries(faqData).map(([id, item]) => (
        <TouchableOpacity
          key={id}
          style={styles.questionButton}
          onPress={() => handleQuestionSelect(parseInt(id))}
        >
          <Card style={styles.questionCard}>
            <Card.Content style={styles.questionContent}>
              <Text style={styles.questionNumber}>[{id}]</Text>
              <Text style={styles.questionText}>{item.question}</Text>
              <MaterialCommunityIcons 
                name="chevron-right" 
                size={20} 
                color={theme.colors.primary} 
              />
            </Card.Content>
          </Card>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={styles.questionButton}
        onPress={() => navigation.goBack()}
      >
        <Card style={[styles.questionCard, styles.backCard]}>
          <Card.Content style={styles.questionContent}>
            <Text style={styles.questionNumber}>[6]</Text>
            <Text style={styles.questionText}>Volver al menú principal</Text>
            <MaterialCommunityIcons 
              name="home" 
              size={20} 
              color={theme.colors.primary} 
            />
          </Card.Content>
        </Card>
      </TouchableOpacity>
    </>
  );

  const renderAnswer = () => (
    <>
      <View style={styles.botMessageContainer}>
        <View style={styles.botAvatar}>
          <MaterialCommunityIcons name="robot" size={24} color="white" />
        </View>
        <View style={styles.botMessage}>
          <Text style={styles.botText}>{faqData[selectedQuestion]?.answer}</Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <CustomButton
          label="Ver más preguntas"
          type="primary"
          icon="format-list-bulleted"
          onPress={handleBackToMenu}
          style={styles.actionButton}
        />
        <CustomButton
          label="Menú principal"
          type="secondary"
          icon="home"
          onPress={() => navigation.goBack()}
          style={styles.actionButton}
        />
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.headerTitle}>Asistente Virtual</Text>
        <View style={{ width: 48 }} />
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {currentView === 'menu' ? renderMenu() : renderAnswer()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'white',
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  botMessageContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  botAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF4081',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  botMessage: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    elevation: 1,
  },
  botText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  questionButton: {
    marginBottom: 12,
  },
  questionCard: {
    elevation: 2,
  },
  backCard: {
    backgroundColor: '#f0f0f0',
  },
  questionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF4081',
    marginRight: 12,
    minWidth: 30,
  },
  questionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  actionButtons: {
    marginTop: 24,
    gap: 12,
  },
  actionButton: {
    marginBottom: 8,
  },
});

export default ChatbotScreen;