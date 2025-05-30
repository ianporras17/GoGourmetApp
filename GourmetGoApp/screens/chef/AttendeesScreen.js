import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { Text, useTheme, Searchbar, Chip, Divider, Avatar, Button as PaperButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import CustomButton from '../../components/CustomButton';
import { getExperienceById, getExperienceAttendees } from '../../firebase/db';
import { formatDate, formatDateTime } from '../../utils/helpers';

const AttendeesScreen = ({ route, navigation }) => {
  const theme = useTheme();
  const { experienceId, experienceName } = route.params;
  
  const [experience, setExperience] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [filteredAttendees, setFilteredAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cargar datos de la experiencia
      const experienceResult = await getExperienceById(experienceId);
      if (experienceResult.error) {
        throw new Error(experienceResult.error);
      }
      setExperience(experienceResult.data);
      
      // Cargar asistentes
      const attendeesResult = await getExperienceAttendees(experienceId);
      if (attendeesResult.error) {
        throw new Error(attendeesResult.error);
      }
      
      setAttendees(attendeesResult.data);
      setFilteredAttendees(attendeesResult.data);
      
    } catch (error) {
      Alert.alert('Error', `No se pudieron cargar los datos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredAttendees(attendees);
      return;
    }
    
    const lowercaseQuery = query.toLowerCase();
    const filtered = attendees.filter(attendee => 
      (attendee.userProfile?.nombre?.toLowerCase().includes(lowercaseQuery)) ||
      (attendee.userProfile?.email?.toLowerCase().includes(lowercaseQuery)) ||
      (attendee.telefono?.toLowerCase().includes(lowercaseQuery))
    );
    
    setFilteredAttendees(filtered);
  };
  
  const generatePDF = async () => {
    try {
      setExporting(true);
      
      // Crear tabla HTML con los datos de los asistentes
      let tableRows = '';
      attendees.forEach((attendee, index) => {
        tableRows += `
          <tr style="background-color: ${index % 2 === 0 ? '#f9f9f9' : '#ffffff'}; padding: 8px; border: 1px solid #ddd;">
            <td style="padding: 8px; border: 1px solid #ddd;">${index + 1}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${attendee.userProfile?.nombre || 'N/A'}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${attendee.userProfile?.email || 'N/A'}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${attendee.telefono || 'N/A'}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${attendee.attendees || 1}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${formatDate(attendee.createdAt)}</td>
          </tr>
        `;
      });
      
      // Crear HTML completo
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Lista de Asistentes - ${experienceName}</title>
            <style>
              body { font-family: 'Helvetica', sans-serif; margin: 40px; }
              h1 { color: #2E7D32; text-align: center; margin-bottom: 10px; }
              h2 { color: #555; text-align: center; margin-bottom: 30px; font-size: 16px; }
              .info { margin-bottom: 20px; }
              .info p { margin: 5px 0; color: #555; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th { background-color: #2E7D32; color: white; text-align: left; padding: 12px 8px; }
              .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #777; }
            </style>
          </head>
          <body>
            <h1>Lista de Asistentes</h1>
            <h2>${experienceName}</h2>
            
            <div class="info">
              <p><strong>Fecha:</strong> ${experience ? formatDate(experience.date) : 'N/A'}</p>
              <p><strong>Lugar:</strong> ${experience ? experience.city : 'N/A'}</p>
              <p><strong>Total de asistentes:</strong> ${attendees.length}</p>
              <p><strong>Generado el:</strong> ${new Date().toLocaleDateString('es-CR')}</p>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th style="padding: 8px; border: 1px solid #ddd;">#</th>
                  <th style="padding: 8px; border: 1px solid #ddd;">Nombre</th>
                  <th style="padding: 8px; border: 1px solid #ddd;">Email</th>
                  <th style="padding: 8px; border: 1px solid #ddd;">Teléfono</th>
                  <th style="padding: 8px; border: 1px solid #ddd;">Personas</th>
                  <th style="padding: 8px; border: 1px solid #ddd;">Fecha Reserva</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
            
            <div class="footer">
              <p>Documento generado por GourmetGoApp</p>
            </div>
          </body>
        </html>
      `;
      
      // Generar PDF
      const { uri } = await Print.printToFileAsync({ html });
      
      // Compartir PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Lista de Asistentes - ${experienceName}`,
          UTI: 'com.adobe.pdf'
        });
      } else {
        Alert.alert('Error', 'La función de compartir no está disponible en este dispositivo');
      }
      
    } catch (error) {
      Alert.alert('Error', `No se pudo generar el PDF: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };
  
  const generateCSV = async () => {
    try {
      setExporting(true);
      
      // Crear encabezados CSV
      let csvContent = 'Número,Nombre,Email,Teléfono,Personas,Fecha Reserva\n';
      
      // Agregar filas
      attendees.forEach((attendee, index) => {
        const row = [
          index + 1,
          attendee.userProfile?.nombre || 'N/A',
          attendee.userProfile?.email || 'N/A',
          attendee.telefono || 'N/A',
          attendee.attendees || 1,
          formatDate(attendee.createdAt)
        ];
        
        // Escapar comas en los valores
        const escapedRow = row.map(value => {
          const stringValue = String(value);
          return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
        });
        
        csvContent += escapedRow.join(',') + '\n';
      });
      
      // Crear un archivo temporal con el contenido CSV
      const fileName = `asistentes_${experienceId}_${Date.now()}.csv`;
      const fileUri = `${Print.tempDirectory}/${fileName}`;
      
      // Usar Print para escribir el archivo (truco para crear un archivo temporal)
      const { uri } = await Print.printToFileAsync({
        html: `<pre>${csvContent}</pre>`,
        uri: fileUri
      });
      
      // Compartir CSV
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'text/csv',
          dialogTitle: `Lista de Asistentes (CSV) - ${experienceName}`,
          UTI: 'public.comma-separated-values-text'
        });
      } else {
        Alert.alert('Error', 'La función de compartir no está disponible en este dispositivo');
      }
      
    } catch (error) {
      Alert.alert('Error', `No se pudo generar el CSV: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };
  
  const renderAttendeeItem = ({ item, index }) => {
    return (
      <View style={[styles.attendeeCard, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.attendeeHeader}>
          <View style={styles.attendeeInfo}>
            <Avatar.Text 
              size={40} 
              label={item.userProfile?.nombre?.substring(0, 2).toUpperCase() || 'NA'} 
              backgroundColor={theme.colors.primary} 
            />
            <View style={styles.nameContainer}>
              <Text style={[styles.attendeeName, { color: theme.colors.text }]}>
                {item.userProfile?.nombre || 'Usuario'}
              </Text>
              <Text style={[styles.attendeeEmail, { color: theme.colors.placeholder }]}>
                {item.userProfile?.email || 'Sin email'}
              </Text>
            </View>
          </View>
          <Chip icon="account-group" style={{ backgroundColor: theme.colors.primaryContainer }}>
            {item.attendees || 1} {(item.attendees || 1) > 1 ? 'personas' : 'persona'}
          </Chip>
        </View>
        
        <Divider style={styles.divider} />
        
        <View style={styles.attendeeDetails}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="phone" size={16} color={theme.colors.primary} />
            <Text style={[styles.detailText, { color: theme.colors.text }]}>
              {item.telefono || 'No disponible'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="calendar-check" size={16} color={theme.colors.primary} />
            <Text style={[styles.detailText, { color: theme.colors.text }]}>
              Reservado el: {formatDate(item.createdAt)}
            </Text>
          </View>
          
          {item.notes && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="note-text" size={16} color={theme.colors.primary} />
              <Text style={[styles.detailText, { color: theme.colors.text }]}>
                Notas: {item.notes}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };
  
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Cargando asistentes...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <MaterialCommunityIcons name="account-group" size={24} color={theme.colors.primary} />
          <Text style={[styles.title, { color: theme.colors.text }]}>Asistentes</Text>
        </View>
        <Text style={[styles.subtitle, { color: theme.colors.placeholder }]}>{experienceName}</Text>
      </View>
      
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Buscar por nombre, email o teléfono"
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchbar}
          iconColor={theme.colors.primary}
        />
      </View>
      
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: theme.colors.primaryContainer }]}>
          <Text style={styles.statNumber}>{attendees.length}</Text>
          <Text style={styles.statLabel}>Total Asistentes</Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: theme.colors.secondaryContainer }]}>
          <Text style={styles.statNumber}>
            {attendees.reduce((total, attendee) => total + (attendee.attendees || 1), 0)}
          </Text>
          <Text style={styles.statLabel}>Total Personas</Text>
        </View>
      </View>
      
      <View style={styles.exportContainer}>
        <CustomButton
          label="Exportar PDF"
          onPress={generatePDF}
          icon="file-pdf-box"
          loading={exporting}
          disabled={exporting || attendees.length === 0}
          style={styles.exportButton}
        />
        
        <CustomButton
          label="Exportar CSV"
          onPress={generateCSV}
          icon="file-delimited"
          loading={exporting}
          disabled={exporting || attendees.length === 0}
          style={styles.exportButton}
        />
      </View>
      
      <View style={styles.listContainer}>
        {filteredAttendees.length > 0 ? (
          <FlatList
            data={filteredAttendees}
            renderItem={renderAttendeeItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="account-search" size={64} color={theme.colors.disabled} />
            <Text style={[styles.emptyText, { color: theme.colors.placeholder }]}>
              {attendees.length > 0 ? 'No se encontraron resultados' : 'No hay asistentes registrados'}
            </Text>
            {attendees.length > 0 && (
              <PaperButton 
                mode="text" 
                onPress={() => handleSearch('')}
                style={styles.resetButton}
              >
                Mostrar todos
              </PaperButton>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchbar: {
    elevation: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  exportContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  exportButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
  attendeeCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  attendeeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attendeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  nameContainer: {
    marginLeft: 12,
    flex: 1,
  },
  attendeeName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  attendeeEmail: {
    fontSize: 14,
  },
  divider: {
    marginVertical: 12,
  },
  attendeeDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  resetButton: {
    marginTop: 8,
  },
});

export default AttendeesScreen;