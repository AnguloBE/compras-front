'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { DiaSemana, HorarioAtencion } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import api from '@/lib/api'
import { ArrowLeft } from 'lucide-react'

const diasSemana = [
  DiaSemana.LUNES,
  DiaSemana.MARTES,
  DiaSemana.MIERCOLES,
  DiaSemana.JUEVES,
  DiaSemana.VIERNES,
  DiaSemana.SABADO,
  DiaSemana.DOMINGO,
]

const diasNombres: Record<DiaSemana, string> = {
  [DiaSemana.LUNES]: 'Lunes',
  [DiaSemana.MARTES]: 'Martes',
  [DiaSemana.MIERCOLES]: 'Miércoles',
  [DiaSemana.JUEVES]: 'Jueves',
  [DiaSemana.VIERNES]: 'Viernes',
  [DiaSemana.SABADO]: 'Sábado',
  [DiaSemana.DOMINGO]: 'Domingo',
}

export default function HorariosPage() {
  const { user, token } = useAuthStore()
  const router = useRouter()
  const [horarios, setHorarios] = useState<HorarioAtencion[]>([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState<DiaSemana | null>(null)
  const [formData, setFormData] = useState({
    horaApertura: '',
    horaCierre: '',
    cerrado: false,
  })

  useEffect(() => {
    if (!user || user.rol !== 'ADMIN') {
      router.push('/login')
      return
    }
    cargarHorarios()
  }, [user, router])

  const cargarHorarios = async () => {
    try {
      setLoading(true)
      const response = await api.get('/horarios', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      setHorarios(response.data)
    } catch (error) {
      console.error('Error al cargar horarios:', error)
      toast.error('Error al cargar los horarios')
    } finally {
      setLoading(false)
    }
  }

  const obtenerHorarioDia = (dia: DiaSemana): HorarioAtencion | undefined => {
    return horarios.find((h) => h.dia === dia && h.activo)
  }

  const abrirEdicion = (dia: DiaSemana) => {
    const horario = obtenerHorarioDia(dia)
    if (horario) {
      setFormData({
        horaApertura: horario.horaApertura,
        horaCierre: horario.horaCierre,
        cerrado: horario.cerrado,
      })
    } else {
      setFormData({
        horaApertura: '09:00',
        horaCierre: '18:00',
        cerrado: false,
      })
    }
    setEditando(dia)
  }

  const guardarHorario = async () => {
    if (!editando) return

    try {
      const horarioExistente = obtenerHorarioDia(editando)
      
      if (horarioExistente) {
        // Actualizar horario existente
        await api.patch(
          `/horarios/${horarioExistente.id}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
        toast.success('Horario actualizado correctamente')
      } else {
        // Crear nuevo horario
        await api.post(
          '/horarios',
          {
            dia: editando,
            ...formData,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
        toast.success('Horario creado correctamente')
      }

      setEditando(null)
      cargarHorarios()
    } catch (error: any) {
      console.error('Error al guardar horario:', error)
      toast.error(error.response?.data?.message || 'Error al guardar el horario')
    }
  }

  const inicializarHorarios = async () => {
    try {
      await api.post(
        '/horarios/initialize',
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      toast.success('Horarios inicializados correctamente')
      cargarHorarios()
    } catch (error) {
      console.error('Error al inicializar horarios:', error)
      toast.error('Error al inicializar los horarios')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <p>Cargando horarios...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4 sm:p-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/admin')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al Panel
        </Button>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Gestión de Horarios de Atención</h1>
          <Button onClick={inicializarHorarios} variant="outline" size="sm">
            Restablecer Horarios
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Día</TableHead>
                <TableHead>Horario</TableHead>
                <TableHead className="hidden sm:table-cell">Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {diasSemana.map((dia) => {
                const horario = obtenerHorarioDia(dia)
                return (
                  <TableRow key={dia}>
                    <TableCell className="font-medium">
                      {diasNombres[dia]}
                    </TableCell>
                    <TableCell>
                      {horario ? (
                        horario.cerrado ? (
                          <span className="text-red-500">Cerrado</span>
                        ) : (
                          <span className="text-sm">{horario.horaApertura} - {horario.horaCierre}</span>
                        )
                      ) : (
                        <span className="text-gray-400 text-sm">No configurado</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {horario ? (
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            horario.cerrado
                              ? 'bg-red-100 text-red-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {horario.cerrado ? 'Cerrado' : 'Abierto'}
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => abrirEdicion(dia)}
                            className="text-xs px-2 py-1"
                          >
                            {horario ? 'Editar' : 'Config'}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle className="text-lg">
                              Configurar horario para {diasNombres[dia]}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`cerrado-${dia}`}
                                checked={formData.cerrado}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    cerrado: e.target.checked,
                                  })
                                }
                                className="w-4 h-4"
                              />
                              <Label htmlFor={`cerrado-${dia}`} className="text-sm">
                                Marcar día como cerrado
                              </Label>
                            </div>

                            {!formData.cerrado && (
                              <>
                                <div className="space-y-2">
                                  <Label htmlFor="horaApertura" className="text-sm">
                                    Hora de Apertura
                                  </Label>
                                  <Input
                                    id="horaApertura"
                                    type="time"
                                    value={formData.horaApertura}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        horaApertura: e.target.value,
                                      })
                                    }
                                    className="w-full"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="horaCierre" className="text-sm">
                                    Hora de Cierre
                                  </Label>
                                  <Input
                                    id="horaCierre"
                                    type="time"
                                    value={formData.horaCierre}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        horaCierre: e.target.value,
                                      })
                                    }
                                    className="w-full"
                                  />
                                </div>
                              </>
                            )}

                            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                              <Button
                                variant="outline"
                                onClick={() => setEditando(null)}
                                className="w-full sm:w-auto"
                              >
                                Cancelar
                              </Button>
                              <Button onClick={guardarHorario} className="w-full sm:w-auto">
                                Guardar
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
