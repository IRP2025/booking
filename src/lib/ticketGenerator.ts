// Ticket Generation Utility
export interface TicketData {
  bookingId: string
  teamLeadName: string
  teamLeadRollNo: string
  projectName: string
  slotDate: string
  slotTime: string
  department: string
  year: string
  userName: string
  userRollNo: string
  userEmail: string
  createdAt: string
}

export class TicketGenerator {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private width: number = 800
  private height: number = 400

  constructor() {
    this.canvas = document.createElement('canvas')
    this.canvas.width = this.width
    this.canvas.height = this.height
    this.ctx = this.canvas.getContext('2d')!
  }

  private createGradient(x1: number, y1: number, x2: number, y2: number, colors: string[]) {
    const gradient = this.ctx.createLinearGradient(x1, y1, x2, y2)
    colors.forEach((color, index) => {
      gradient.addColorStop(index / (colors.length - 1), color)
    })
    return gradient
  }

  private drawRoundedRect(x: number, y: number, width: number, height: number, radius: number) {
    this.ctx.beginPath()
    this.ctx.moveTo(x + radius, y)
    this.ctx.lineTo(x + width - radius, y)
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    this.ctx.lineTo(x + width, y + height - radius)
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    this.ctx.lineTo(x + radius, y + height)
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    this.ctx.lineTo(x, y + radius)
    this.ctx.quadraticCurveTo(x, y, x + radius, y)
    this.ctx.closePath()
  }

  private drawQRCode(data: string, x: number, y: number, size: number) {
    // Simple QR code placeholder - in production, use a proper QR library
    this.ctx.fillStyle = '#000'
    this.ctx.fillRect(x, y, size, size)
    
    // Draw a simple pattern to represent QR code
    this.ctx.fillStyle = '#fff'
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        if ((i + j) % 2 === 0) {
          this.ctx.fillRect(x + i * (size / 8), y + j * (size / 8), size / 8, size / 8)
        }
      }
    }
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  private formatTime(timeString: string): string {
    return timeString
  }

  generateTicket(data: TicketData): Promise<string> {
    return new Promise((resolve) => {
      // Clear canvas
      this.ctx.clearRect(0, 0, this.width, this.height)

      // Background gradient
      const bgGradient = this.createGradient(0, 0, this.width, this.height, [
        '#667eea',
        '#764ba2',
        '#f093fb'
      ])
      this.ctx.fillStyle = bgGradient
      this.ctx.fillRect(0, 0, this.width, this.height)

      // Main ticket card
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
      this.drawRoundedRect(20, 20, this.width - 40, this.height - 40, 20)
      this.ctx.fill()

      // Header section
      this.ctx.fillStyle = '#1e40af'
      this.ctx.font = 'bold 32px Arial'
      this.ctx.textAlign = 'center'
      this.ctx.fillText('IRP BOOKING TICKET', this.width / 2, 70)

      // Booking ID
      this.ctx.fillStyle = '#64748b'
      this.ctx.font = '16px Arial'
      this.ctx.fillText(`Booking ID: ${data.bookingId}`, this.width / 2, 95)

      // Main content area
      const contentY = 130
      const leftColumn = 50
      const rightColumn = 450

      // Left column - Booking details
      this.ctx.fillStyle = '#1e293b'
      this.ctx.font = 'bold 18px Arial'
      this.ctx.textAlign = 'left'
      this.ctx.fillText('BOOKING DETAILS', leftColumn, contentY)

      this.ctx.font = '14px Arial'
      this.ctx.fillStyle = '#475569'
      
      let yOffset = contentY + 30
      this.ctx.fillText(`Date: ${this.formatDate(data.slotDate)}`, leftColumn, yOffset)
      yOffset += 25
      this.ctx.fillText(`Time: ${this.formatTime(data.slotTime)}`, leftColumn, yOffset)
      yOffset += 25
      this.ctx.fillText(`Department: ${data.department}`, leftColumn, yOffset)
      yOffset += 25
      this.ctx.fillText(`Year: ${data.year}`, leftColumn, yOffset)

      // Right column - Team details
      this.ctx.fillStyle = '#1e293b'
      this.ctx.font = 'bold 18px Arial'
      this.ctx.fillText('TEAM DETAILS', rightColumn, contentY)

      this.ctx.font = '14px Arial'
      this.ctx.fillStyle = '#475569'
      
      yOffset = contentY + 30
      this.ctx.fillText(`Project: ${data.projectName}`, rightColumn, yOffset)
      yOffset += 25
      this.ctx.fillText(`Team Lead: ${data.teamLeadName}`, rightColumn, yOffset)
      yOffset += 25
      this.ctx.fillText(`Lead Roll No: ${data.teamLeadRollNo}`, rightColumn, yOffset)
      yOffset += 25
      this.ctx.fillText(`Booked By: ${data.userName}`, rightColumn, yOffset)

      // QR Code section
      const qrSize = 80
      const qrX = this.width - 120
      const qrY = this.height - 120
      
      this.ctx.fillStyle = '#f8fafc'
      this.drawRoundedRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, 10)
      this.ctx.fill()

      this.drawQRCode(data.bookingId, qrX, qrY, qrSize)

      // QR Code label
      this.ctx.fillStyle = '#64748b'
      this.ctx.font = '12px Arial'
      this.ctx.textAlign = 'center'
      this.ctx.fillText('Scan for verification', qrX + qrSize / 2, qrY + qrSize + 25)

      // Footer
      this.ctx.fillStyle = '#64748b'
      this.ctx.font = '12px Arial'
      this.ctx.textAlign = 'center'
      this.ctx.fillText(`Generated on: ${new Date().toLocaleString()}`, this.width / 2, this.height - 20)

      // Convert to data URL
      const dataURL = this.canvas.toDataURL('image/png')
      resolve(dataURL)
    })
  }

  downloadTicket(data: TicketData, filename?: string): Promise<void> {
    return new Promise((resolve) => {
      this.generateTicket(data).then((dataURL) => {
        const link = document.createElement('a')
        link.download = filename || `irp-booking-ticket-${data.bookingId}.png`
        link.href = dataURL
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        resolve()
      })
    })
  }
}

// Utility function for easy usage
export const generateAndDownloadTicket = async (data: TicketData): Promise<void> => {
  const generator = new TicketGenerator()
  await generator.downloadTicket(data)
}

export const generateTicketPreview = async (data: TicketData): Promise<string> => {
  const generator = new TicketGenerator()
  return await generator.generateTicket(data)
}
