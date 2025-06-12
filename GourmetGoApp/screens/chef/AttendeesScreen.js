import { getAuth }   from '../../utils/authStorage';
import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, FlatList, ActivityIndicator,
  Alert, TouchableOpacity
} from 'react-native';
import {
  Text, useTheme, Searchbar, Chip, Divider,
  Avatar, Button as PaperButton
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Print    from 'expo-print';
import * as Sharing  from 'expo-sharing';

import CustomButton from '../../components/CustomButton';

import {
  getExperience,
  getReservationsByExperience
} from '../../utils/api';
import { formatDate } from '../../utils/helpers';

const AttendeesScreen = ({ route, navigation }) => {
  const theme = useTheme();
  const { experienceId, experienceName } = route.params;

  /* -------- estado -------- */
  const [auth, setAuth] = useState(null);  
  const [experience, setExperience] = useState(null);
  const [attendees, setAttendees]   = useState([]);
  const [filtered, setFiltered]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [exporting, setExporting]   = useState(false);
  const [query, setQuery]           = useState('');


  useEffect(() => {
    getAuth().then(setAuth);        // 1: obtener token
  }, []);
  useEffect(() => {
    if (auth) {
      loadData();
    }
  }, [auth]);

  const loadData = async () => {
    try {
      setLoading(true);

      const exp = await getExperience(experienceId);
      if (exp.error) throw new Error(exp.error);
      setExperience(exp);

      const resv = await getReservationsByExperience(auth.token, experienceId);
      if (resv.error) throw new Error(resv.error);

      setAttendees(resv);
      setFiltered(resv);
    } catch (err) {
      Alert.alert('Error', `No se pudieron cargar los datos: ${err.message}`);
      navigation.goBack();
    } finally { setLoading(false); }
  };

  /* -------- búsqueda -------- */
  const handleSearch = (q) => {
    setQuery(q);
    if (!q.trim()) { setFiltered(attendees); return; }
    const lower = q.toLowerCase();
    const filt  = attendees.filter(a =>
      a.user_nombre.toLowerCase().includes(lower) ||
      a.user_email.toLowerCase().includes(lower)  ||
      (a.telefono || '').toLowerCase().includes(lower)
    );
    setFiltered(filt);
  };

  /* -------- exportar PDF -------- */
  const generatePDF = async () => {
    try {
      setExporting(true);

      /* filas */
      let rows = '';
      attendees.forEach((a,i)=>{
        rows += `
          <tr style="background:${i%2?'#fff':'#f9f9f9'}">
            <td>${i+1}</td>
            <td>${a.user_nombre}</td>
            <td>${a.user_email}</td>
            <td>${a.telefono||'N/A'}</td>
            <td>${a.asistentes||1}</td>
            <td>${formatDate(a.created_at)}</td>
          </tr>`;
      });

      const html = `
        <html><head><meta charset="utf-8">
        <style>
          body{font-family:Helvetica;margin:40px;}
          table{width:100%;border-collapse:collapse;}
          th,td{border:1px solid #ddd;padding:8px;font-size:12px;}
          th{background:#2E7D32;color:#fff;text-align:left;}
        </style></head><body>
          <h1>Lista de Asistentes</h1>
          <h2>${experienceName}</h2>
          <p><b>Fecha:</b> ${formatDate(experience.fecha_hora)}</p>
          <p><b>Lugar:</b> ${experience.ciudad}</p>
          <p><b>Total asistentes:</b> ${attendees.length}</p>
          <table><thead>
            <tr><th>#</th><th>Nombre</th><th>Email</th>
                <th>Teléfono</th><th>Personas</th><th>Reserva</th></tr>
          </thead><tbody>${rows}</tbody></table>
        </body></html>`;

      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType:'application/pdf',
          dialogTitle:`Lista de Asistentes - ${experienceName}`
        });
      } else {
        Alert.alert('Error','Compartir no disponible');
      }
    } catch (err) {
      Alert.alert('Error', `No se pudo generar el PDF: ${err.message}`);
    } finally { setExporting(false); }
  };

  /* -------- exportar CSV -------- */
  const generateCSV = async () => {
    try {
      setExporting(true);
      let csv = 'N°,Nombre,Email,Teléfono,Personas,Reserva\n';
      attendees.forEach((a,i)=>{
        csv += `${i+1},"${a.user_nombre}","${a.user_email}",${a.telefono||'N/A'},${a.asistentes||1},${formatDate(a.created_at)}\n`;
      });
      const { uri } = await Print.printToFileAsync({ html:`<pre>${csv}</pre>` });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType:'text/csv',
          dialogTitle:`Lista asistentes - ${experienceName}`
        });
      }
    } catch (err) {
      Alert.alert('Error', `No se pudo generar CSV: ${err.message}`);
    } finally { setExporting(false); }
  };

  /* -------- render item -------- */
  const Item = ({ item, index }) => (
    <View style={[styles.card,{backgroundColor:theme.colors.surface}]}>
      <View style={styles.cardHeader}>
        <Avatar.Text size={40} label={item.user_nombre.slice(0,2).toUpperCase()}
                     backgroundColor={theme.colors.primary}/>
        <View style={{marginLeft:12,flex:1}}>
          <Text style={[styles.name,{color:theme.colors.text}]}>{item.user_nombre}</Text>
          <Text style={[styles.email,{color:theme.colors.placeholder}]}>{item.user_email}</Text>
        </View>
        <Chip icon="account-group" style={{backgroundColor:theme.colors.primaryContainer}}>
          {item.asistentes||1}
        </Chip>
      </View>
      <Divider style={styles.divider}/>
      <View style={styles.row}>
        <MaterialCommunityIcons name="phone" size={16} color={theme.colors.primary}/>
        <Text style={[styles.detail,{color:theme.colors.text}]}>
          {item.telefono||'N/A'}
        </Text>
      </View>
      <View style={styles.row}>
        <MaterialCommunityIcons name="calendar-check" size={16} color={theme.colors.primary}/>
        <Text style={[styles.detail,{color:theme.colors.text}]}>
          {formatDate(item.created_at)}
        </Text>
      </View>
    </View>
  );

  /* -------- loading -------- */
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary}/>
          <Text style={{marginTop:16}}>Cargando asistentes…</Text>
        </View>
      </SafeAreaView>
    );
  }

  /* -------- UI -------- */
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="account-group" size={24} color={theme.colors.primary}/>
          <Text style={styles.headerTitle}>Asistentes</Text>
        </View>
        <Text style={styles.headerSub}>{experienceName}</Text>
      </View>

      <View style={styles.searchBox}>
        <Searchbar
          placeholder="Buscar nombre, email, teléfono"
          value={query} onChangeText={handleSearch}
        />
      </View>

      <View style={styles.exportRow}>
        <CustomButton label="PDF" icon="file-pdf-box" style={styles.expBtn}
          onPress={generatePDF} loading={exporting} disabled={exporting||!attendees.length}/>
        <CustomButton label="CSV" icon="file-delimited" style={styles.expBtn}
          onPress={generateCSV} loading={exporting} disabled={exporting||!attendees.length}/>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={i=>i.id.toString()}
        renderItem={Item}
        contentContainerStyle={{padding:16,paddingBottom:40}}
        ListEmptyComponent={()=>(
          <View style={styles.center}>
            <MaterialCommunityIcons name="account-search" size={64} color={theme.colors.disabled}/>
            <Text style={{marginTop:16,color:theme.colors.placeholder}}>
              {attendees.length?'Sin resultados':'No hay asistentes'}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

/* -------- estilos -------- */
const styles = StyleSheet.create({
  container:{ flex:1 },
  center:{ flex:1,justifyContent:'center',alignItems:'center' },
  header:{ padding:16,paddingBottom:8 },
  titleRow:{ flexDirection:'row',alignItems:'center' },
  headerTitle:{ fontSize:24,fontWeight:'bold',marginLeft:8 },
  headerSub:{ fontSize:16,marginTop:4 },
  searchBox:{ paddingHorizontal:16,marginBottom:8 },
  exportRow:{ flexDirection:'row',paddingHorizontal:16,marginBottom:8 },
  expBtn:{ flex:1,marginHorizontal:4 },
  card:{ borderRadius:8,padding:16,marginBottom:12,elevation:2 },
  cardHeader:{ flexDirection:'row',alignItems:'center' },
  name:{ fontSize:16,fontWeight:'bold' },
  email:{ fontSize:14 },
  divider:{ marginVertical:8 },
  row:{ flexDirection:'row',alignItems:'center',marginTop:4 },
  detail:{ marginLeft:8,fontSize:14 },
});

export default AttendeesScreen;