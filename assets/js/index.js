const $ = require('jquery')
const $window = $(window)

window.$ = $

class OrderedColumns {
	constructor (gridConfig, $el, $items) {
		this.$el = $el
		this.gridConfig = gridConfig
		this.currentBreakpoint = this.getBreakpoint($window.innerWidth())
		this.items = $items.toArray()
		this.displayed = false

		$window.on('resize', () => this.reorder())

		this.reorderCols()
	}

	getBreakpoint (width) {
		let breakpoint = 0

		while (breakpoint < this.gridConfig.breakpoints.length && this.gridConfig.breakpoints[breakpoint] < width) {
			breakpoint++
		}

		return breakpoint
	}

	reorderCols () {
	
		const nbCols = this.gridConfig.cols[this.currentBreakpoint]
		let cols = []

		for (let i = 0; i < nbCols; i++) {
			cols.push([])
		}

		this.items.forEach((el, i) => cols[i%nbCols].push(el.outerHTML))

		const html = cols.map((col) => `<div class="col">${col.join('')}</div>`).join('')

		this.$el.html(html)

		if (!this.displayed) {
			this.$el.removeClass('invisible')
			this.displayed = true
		}
	}

	needReorder () {
		return this.getBreakpoint($window.innerWidth()) != this.currentBreakpoint
	}

	reorder () {
		if (this.needReorder()) {
			this.currentBreakpoint = this.getBreakpoint($window.innerWidth())

			this.reorderCols()
		}
	}
}

const episodeGrid = new OrderedColumns({
	breakpoints: [850, 1200, Infinity],
	cols: [1, 2, 3]
}, $(".episode-grid"), $('.episode-grid .episode'))

const notesGrid = new OrderedColumns({
	breakpoints: [750, 1000, 1250, Infinity],
	cols: [1, 2, 3, 2]
}, $(".notes-grid"), $('.notes-grid .note-wrapper'))

const activePlayer = $('iframe.sc-player')[0]

if (activePlayer) {

	const player = SC.Widget(activePlayer)
	const $progress = $('.progress')
	const $player = $('.player')
	const $playButton = $('.play-pause-button')
	const $currentTime = $('.current-time')
	let playerOffset
	let playerWidth
	let wWidth = $window.innerWidth()
	let scrub
	let isPlaying = false
	let canPlay = false

	const setDimensions = () => {
		
		$('.audio-player').css('width', $('.show-notes').width())
		playerOffset = $player.offset()
		playerWidth = $player.width()
		wWidth = $window.innerWidth()
	}

	setDimensions()

	const togglePlay = () => {

		if (canPlay) {
			console.log("CAN PLAY", isPlaying)
			player.toggle()

			if (isPlaying) {
				isPlaying = false
				$('.play').removeClass('hidden')
				$('.pause').addClass('hidden')
			}
			else {
				isPlaying = true
				$('.pause').removeClass('hidden')
				$('.play').addClass('hidden')
			}
		}
	}

	const msToHumanTime = (milliseconds) => {
		const timeInSec = Math.floor(milliseconds / 1000)
		const minutes = Math.floor(timeInSec / 60)
		const seconds = timeInSec % 60

		return `${minutes < 10 ? `0${minutes}` : minutes}:${seconds < 10 ? `0${seconds}` : seconds}`
	}

	const toMs = (time = '') => {
	    const parts = time.split(':')
	    const minutes = parseInt(parts[0] || 0, 10)
	    const seconds = parseInt(parts[1] || 0, 10)

	    return (minutes * 60) + seconds
	}

	const setPlayHead = (scrub) => {
		$progress.css('width', `${scrub * 100}%`)
		player.seekTo(player.duration * scrub)
	}

	$(window).on('resize', setDimensions)

	$('.note-pastille').on('click', (ev) => {
		ev.stopPropagation()
		ev.preventDefault()

		const el = $(`#${$(ev.target).data('id')}`)
		let offset = 40

		let scrollParent = $(".show-notes")

		if (wWidth < 1250) {
			scrollParent = $('body, html')
			offset = 100
		}

		$('.note').removeClass('active')

		el.addClass('active')

		scrollParent.animate({
			scrollTop: el.position().top - offset
		}, 500)
	})

	$('.timestamp').on('click', (ev) => {
		const time = toMs($(ev.target).data('timestamp'))
		console.log(time/(player.duration / 1000))
		setPlayHead(time/(player.duration / 1000))
	})

	$('.player .notes').on('click', (ev) => {
		ev.stopPropagation()
	})

	player.bind(SC.Widget.Events.READY, function() {
		player.getCurrentSound(function(song) {
			// var waveformPng = song.waveform_url.replace('json', 'png').replace('wis', 'w1')        
			// $('.waveform').css('background-image', "url('" + waveformPng + "')")

			// $player.addClass('shown')

			player.current = song
			canPlay = true
		})
		
		player.getDuration(function(value){
			player.duration = value
		})

		player.isPaused(function(bool){
			player.getPaused = bool
		})
	})

	$playButton.on('click', (ev) => {
		console.log("PLAY")
		togglePlay()
	})

	player.bind(SC.Widget.Events.PLAY_PROGRESS, ev => {
		$progress.css('width', `${ev.relativePosition * 100}%`)
		$currentTime.text(msToHumanTime(ev.currentPosition))
	})

	$(document).on('keydown', ev => {
		if (ev.keyCode === 32) {
			ev.preventDefault()
			togglePlay() 
		}
	})

	$player.on('click', (ev) => {
		scrub = (ev.pageX - playerOffset.left) / playerWidth

		setPlayHead(scrub)
	})
}