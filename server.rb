#!/usr/bin/env ruby
# frozen_string_literal: true

require 'webrick'
require 'json'
require 'fileutils'

PORT = 8080
PUBLIC_DIR = File.expand_path('public', __dir__)

puts "=========================================================="
puts "  TITAN FLEET COMMAND - Enterprise Telematics Server"
puts "  Serving static files from: #{PUBLIC_DIR}"
puts "  Listening at: http://localhost:#{PORT}"
puts "=========================================================="

# Create WEBrick server
server = WEBrick::HTTPServer.new(
  Port: PORT,
  DocumentRoot: PUBLIC_DIR,
  AccessLog: [],
  Logger: WEBrick::Log.new($stderr, WEBrick::Log::WARN)
)

# Trap termination signals
trap('INT') { server.shutdown }
trap('TERM') { server.shutdown }

# REST API Endpoints
# 1. Telemetry Health Endpoint
server.mount_proc '/api/health' do |req, res|
  res['Content-Type'] = 'application/json'
  res.body = {
    status: 'online',
    system: 'Titan Fleet Command OS',
    version: '4.2.0',
    can_bus_connected: true,
    active_vehicles: 6,
    timestamp: Time.now.utc.iso8601
  }.to_json
end

# 2. Fleet Telemetry API
server.mount_proc '/api/vehicles' do |req, res|
  res['Content-Type'] = 'application/json'
  fleet = [
    { id: 'TRK-101', driver: 'Marcus Vance', speed: 64, fuel: 84, status: 'transit', route: 'Chicago -> Dallas' },
    { id: 'TRK-204', driver: 'Elena Rostova', speed: 68, fuel: 62, status: 'transit', route: 'Atlanta -> Miami' },
    { id: 'TRK-308', driver: 'David Chen', speed: 0, fuel: 45, status: 'idle', route: 'Seattle -> Denver' },
    { id: 'TRK-415', driver: 'Jamal Washington', speed: 61, fuel: 91, status: 'transit', route: 'Long Beach -> Phoenix' },
    { id: 'TRK-520', driver: 'Sarah Jenkins', speed: 0, fuel: 73, status: 'loading', route: 'Kansas City -> Baltimore' },
    { id: 'TRK-633', driver: 'Robert Morales', speed: 65, fuel: 58, status: 'transit', route: 'Detroit -> Philadelphia' }
  ]
  res.body = { vehicles: fleet, count: fleet.size }.to_json
end

# 3. Dynamic Salary Calculation API
server.mount_proc '/api/salary/calculate' do |req, res|
  res['Content-Type'] = 'application/json'
  params = WEBrick::HTTPUtils.parse_query(req.query_string)
  miles = (params['miles'] || 4500).to_f
  rate = (params['rate'] || 0.65).to_f
  detention_hrs = (params['detention'] || 8).to_f
  bonuses = (params['bonuses'] || 400).to_f

  mileage_pay = miles * rate
  detention_pay = detention_hrs * 28.00
  gross = mileage_pay + detention_pay + bonuses
  tax = gross * 0.18
  deductions = 140.00
  net = gross - tax - deductions

  res.body = {
    gross: gross.round(2),
    mileage_pay: mileage_pay.round(2),
    detention_pay: detention_pay.round(2),
    bonuses: bonuses.round(2),
    taxes: tax.round(2),
    deductions: deductions.round(2),
    net: net.round(2)
  }.to_json
end

server.start
